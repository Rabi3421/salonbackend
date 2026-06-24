import mongoose from "mongoose";

import { getServerEnv } from "@/src/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalForMongoose.mongooseCache) {
  globalForMongoose.mongooseCache = cache;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const { MONGODB_URI } = getServerEnv();

    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
