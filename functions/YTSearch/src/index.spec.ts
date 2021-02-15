import { createResponse, createRequest, MockResponse, MockRequest } from 'node-mocks-http';
import { Response, Request } from 'express';
import { youtubeSearch, BAD_REQUEST_MESSAGE, YOUTUBE_API_URL } from '.';
import { STATUS_CODES } from 'http';
import axios from 'axios';

let res: MockResponse<Response>;
let req: MockRequest<Request>;

describe('YTSearch', () => {
  beforeEach(() => {
    process.env['YOUTUBE_KEY'] = 'YOUTUBE_KEY';
    res = createResponse();
    req = createRequest();
  });
  describe('Not API Key Provided', () => {
    it('Should return status 501', async () => {
      process.env['YOUTUBE_KEY'] = '';
      await youtubeSearch(req, res);
      expect(res.statusCode).toBe(501);
    });
    it('Should send statuscode message for error 501', async () => {
      process.env['YOUTUBE_KEY'] = '';
      await youtubeSearch(req, res);
      expect(res._getData()).toStrictEqual(STATUS_CODES[501]);
    });
  });
  describe('Not Search Param Provided', () => {
    it('Should return status 400', async () => {
      await youtubeSearch(req, res);
      expect(res.statusCode).toBe(400);
    });
    it('Should send BAD_REQUEST_MESSAGE', async () => {
      await youtubeSearch(req, res);
      expect(res._getData()).toStrictEqual(BAD_REQUEST_MESSAGE);
    });
  });
  describe('Youtube API Call', () => {
    it('Should call youtube api with right parameters and send response', async () => {
      const search = 'MOCK_SEARCH';
      const params = new URLSearchParams({ key: 'YOUTUBE_KEY', part: 'snippet', maxResult: '10', q: search as string }).toString();
      const url = `${YOUTUBE_API_URL}/search?${params}`;
      const spyAxios = jest.spyOn(axios, 'get').mockResolvedValueOnce({ data: 'response' });
      req.query = { search };
      await youtubeSearch(req, res);
      expect(spyAxios).toHaveBeenCalledWith(url);
      expect(res._getData()).toStrictEqual('response');
    });
    it('Should send error message if youtube call fails', async () => {
      jest.spyOn(axios, 'get').mockRejectedValueOnce('ERROR');
      req.query = { search: 'MOCK_SEARCH' };
      await youtubeSearch(req, res);
      expect(res._getData()).toStrictEqual('ERROR');
    });
  });
});
