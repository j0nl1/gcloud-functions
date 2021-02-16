import { connect, Db } from 'mongodb';

export interface Page {
  longUrl: string;
  shortUrl: string;
}

export class MongoDB {
  static db: Db;
  static dbName = 'urlShortener';
  static collections = { pages: 'pages', statictis: 'statictis' };

  static async initDb(uri: string): Promise<void> {
    const connection = await connect(uri, { useUnifiedTopology: true });
    this.db = connection.db(this.dbName);
  }
  static async findUrl(shortUrl: string): Promise<Page | null> {
    return await this.db.collection(this.collections.pages).findOne({ shortUrl });
  }
  static async insertStatistics(stactictis: unknown): Promise<void> {
    await this.db.collection(this.collections.statictis).insertOne(stactictis);
  }
}
