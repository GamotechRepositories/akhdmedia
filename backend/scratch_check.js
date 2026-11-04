import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'akhdmedia/backend/.env' });

import UserSubscription from './models/UserSubscription.js';
import Order from './models/Order.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const subs = await UserSubscription.find({ 'downloadedVideos.0': { $exists: true } }).populate('userId');
  console.log('Subscriptions with downloadedVideos count:', subs.length);
  for (const s of subs) {
    console.log('User:', s.userId?.email, 'Videos:', s.downloadedVideos.length);
    for (const v of s.downloadedVideos) {
      console.log(' - Video:', v.name, v.clipId, v.claimedAt);
    }
  }
  const orders = await Order.countDocuments();
  console.log('Total Orders count in DB:', orders);
  await mongoose.disconnect();
}
check().catch(console.error);

