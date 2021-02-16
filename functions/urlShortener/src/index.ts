import { Request, Response } from 'express';
import { STATUS_CODES, IncomingHttpHeaders } from 'http';
import { MongoDB } from './db';

export const URL_REDIRECT = 'https://tecnomadas.com';

interface TargetHeaders {
  referer: string;
  country: string;
  region: string;
  location: string;
  ip: string;
}

interface Location {
  type: 'Point';
  coordinates: [number, number];
}

interface Statistics {
  referer?: string;
  location?: Location | {};
  country?: string;
  region?: string;
  ip?: string;
  reference: string;
  accededAt: Date;
}

export const urlShortener = async (req: Request, res: Response): Promise<Response<string> | void> => {
  const { URI_MONGODB } = process.env;
  if (!URI_MONGODB) return res.status(501).send(STATUS_CODES[501]);
  const shortUrl = req.params['0'];
  if (!shortUrl) return res.redirect(URL_REDIRECT);
  try {
    await MongoDB.initDb(URI_MONGODB);
    const page = await MongoDB.findUrl(shortUrl);
    if (!page) return res.redirect(URL_REDIRECT);
    const statictis = createStatictis(req.headers, shortUrl);
    await MongoDB.insertStatistics(statictis);
    return res.redirect(page.longUrl);
  } catch (err) {
    return res.status(422).send(err);
  }
};

export const createStatictis = (headers: IncomingHttpHeaders, reference: string): Statistics => {
  const targetHeaders = filterTransformHeaders(headers);
  const location = createLocation(targetHeaders.location);
  return { ...targetHeaders, ...location, reference, accededAt: new Date() };
};

export const filterTransformHeaders = (headers: IncomingHttpHeaders): TargetHeaders => {
  type HeaderKey = keyof typeof headerTransformation;
  const headerTransformation = {
    referer: 'referer',
    'x-appengine-country': 'country',
    'x-appengine-region': 'region',
    'x-appengine-user-ip': 'ip',
    'x-appengine-citylatlong': 'location'
  };

  return Object.keys(headerTransformation).reduce((acc: TargetHeaders, header: string): TargetHeaders => {
    if (headers.hasOwnProperty(header)) {
      const property = headerTransformation[header as HeaderKey];
      return Object.assign(acc, { [property]: headers[header] });
    }
    return acc;
  }, {} as TargetHeaders);
};

export const createLocation = (location: string): { location: Location } | {} => {
  if (location?.includes(',')) {
    const [lat, lng] = location.split(',');
    return {
      location: {
        type: 'Point',
        coordinates: [+lat, +lng]
      }
    };
  }
  return {};
};
