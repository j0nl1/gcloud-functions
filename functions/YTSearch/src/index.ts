import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';
import axios from 'axios';

export const BAD_REQUEST_MESSAGE = 'Search param not provided';
export const YOUTUBE_API_URL = 'https://youtube.googleapis.com/youtube/v3';

export const youtubeSearch = async (req: Request, res: Response): Promise<Response<string>> => {
  const { YOUTUBE_KEY } = process.env;
  const { search } = req.query;
  if (!YOUTUBE_KEY) return res.status(501).send(STATUS_CODES[501]);
  if (!search) return res.status(400).send(BAD_REQUEST_MESSAGE);
  const params = new URLSearchParams({ key: YOUTUBE_KEY, part: 'snippet', maxResult: '10', q: search as string }).toString();
  try {
    const { data } = await axios.get(`${YOUTUBE_API_URL}/search?${params}`);
    return res.send(data);
  } catch (err) {
    return res.status(422).send(err);
  }
};
