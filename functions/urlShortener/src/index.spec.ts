import { createResponse, createRequest, MockResponse, MockRequest } from 'node-mocks-http';
import { Response, Request } from 'express';
import { STATUS_CODES } from 'http';
import * as useCase from '.';
import { MongoDB, Page } from './db';

let res: MockResponse<Response>;
let req: MockRequest<Request>;

const mockHeaders = {
  referer: 'test',
  'x-appengine-country': 'test',
  'x-appengine-region': 'test',
  'x-appengine-user-ip': 'test',
  'x-appengine-citylatlong': 'test',
  'false-header': 'test'
};

describe('useCase urlShortener', () => {
  beforeEach(() => {
    process.env['URI_MONGODB'] = 'URI_MONGODB';
    jest.spyOn(MongoDB, 'initDb').mockResolvedValue();
    res = createResponse();
    req = createRequest();
    req.params = { '0': 'shortUrl' };
  });
  describe('Function urlShortener', () => {
    it('Should return message and status 501 if URI_MONGODB is not provided', async () => {
      process.env['URI_MONGODB'] = '';
      await useCase.urlShortener(req, res);
      expect(res.statusCode).toBe(501);
      expect(res._getData()).toStrictEqual(STATUS_CODES[501]);
    });
    it('Should redirect to URL_REDIRECT if not param found', async () => {
      req.params = {};
      await useCase.urlShortener(req, res);
      expect(res.statusCode).toBe(302);
      expect(res._getRedirectUrl()).toStrictEqual(useCase.URL_REDIRECT);
    });
    it("Should redirect if longUrl isn't found", async () => {
      const spyFindUrl = jest.spyOn(MongoDB, 'findUrl').mockResolvedValueOnce(null);
      await useCase.urlShortener(req, res);
      expect(spyFindUrl).toHaveBeenCalledWith('shortUrl');
      expect(res.statusCode).toBe(302);
      expect(res._getRedirectUrl()).toStrictEqual(useCase.URL_REDIRECT);
    });
    it('Should call createStatictis, insertStatistics and redirect if a page is found', async () => {
      const longUrl = 'longUrl';
      jest.spyOn(MongoDB, 'findUrl').mockResolvedValueOnce({ longUrl } as Page);
      const spyCreateStatictis = jest.spyOn(useCase, 'createStatictis');
      const insertStatistic = jest.spyOn(MongoDB, 'insertStatistics').mockResolvedValueOnce();
      await useCase.urlShortener(req, res);
      expect(spyCreateStatictis).toHaveBeenCalled();
      expect(insertStatistic).toHaveBeenCalled();
      expect(res.statusCode).toBe(302);
      expect(res._getRedirectUrl()).toStrictEqual(longUrl);
    });
  });
  describe('Function createLocation', () => {
    it("Should return an empty object if location is not provided or doesn't include a colon", () => {
      const responseWithoutLocaiton = useCase.createLocation('');
      expect(responseWithoutLocaiton).toEqual({});
      const responseWithoutcolon = useCase.createLocation('34 45');
      expect(responseWithoutcolon).toEqual({});
    });
    it('Should return a location structure if the right parameter is provided', () => {
      const structure = { location: { type: 'Point', coordinates: [43, 34] } };
      const response = useCase.createLocation('43, 34');
      expect(response).toEqual(structure);
    });
  });
  describe('Function filterTransformHeaders', () => {
    it('Should return an empty object if header not match target headers', () => {
      const response = useCase.filterTransformHeaders({ test: 'Example' });
      expect(response).toEqual({});
    });
    it('Should return the headers matches in a new object with different property name', () => {
      const response = useCase.filterTransformHeaders(mockHeaders);
      expect(response).toHaveProperty('referer');
      expect(response).toHaveProperty('location');
      expect(response).toHaveProperty('ip');
      expect(response).toHaveProperty('region');
      expect(response).toHaveProperty('country');
      expect(Object.keys(response).length).toBe(5);
    });
  });
  describe('Function createStatictis', () => {
    it('Should return an object with reference and accededAt even if not header provided', () => {
      const response = useCase.createStatictis({}, 'shortUrl');
      expect(Object.keys(response).length).toBe(2);
      expect(response).toHaveProperty('accededAt');
      expect(response).toHaveProperty('reference');
    });
    it('Should call filterTransformHeaders and Createlocation to compose a new object with this values', () => {
      const spyFilter = jest.spyOn(useCase, 'filterTransformHeaders');
      const spyLocation = jest.spyOn(useCase, 'createLocation');
      const response = useCase.createStatictis(mockHeaders, 'shortUrl');
      expect(spyFilter).toHaveBeenCalledWith(mockHeaders);
      expect(spyLocation).toHaveBeenCalled();
      expect(response).toHaveProperty('referer');
      expect(response).toHaveProperty('location');
      expect(response).toHaveProperty('ip');
      expect(response).toHaveProperty('region');
      expect(response).toHaveProperty('country');
      expect(Object.keys(response).length).toBe(7);
    });
  });
});
