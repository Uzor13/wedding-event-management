// Central model registry - ensures all models are loaded in correct order
// Import this file in API routes instead of importing models individually

import Couple from './Couple';
import Setting from './Setting';
import Tag from './Tag';
import Guest from './Guest';
import BudgetItem from './Budget';
import Event from './Event';
import GiftRegistry from './GiftRegistry';
import Message from './Message';
import Photo from './Photo';
import TimelineItem from './Timeline';

// Export all models
export {
  Couple,
  Setting,
  Tag,
  Guest,
  BudgetItem,
  Event,
  GiftRegistry,
  Message,
  Photo,
  TimelineItem
};

// Default export for convenience
export default {
  Couple,
  Setting,
  Tag,
  Guest,
  BudgetItem,
  Event,
  GiftRegistry,
  Message,
  Photo,
  TimelineItem
};
