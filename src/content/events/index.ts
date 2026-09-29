import type { WorkEvent } from "@/types/content";
import { entrepreneurshipEvents } from "./entrepreneurship";
import { leadershipEvents } from "./leadership";
import { academicEvents } from "./academic";
import { globalEvents } from "./global";
import { communicationEvents } from "./communication";
import { writingEvents } from "./writing";
import { artsEvents } from "./arts";
import { sportsEvents } from "./sports";
import { schoolEvents } from "./school";

/**
 * DID + RECOGNIZED — EVENTS
 *
 * Every competition, programme, workshop, role, performance and award is
 * one record in one of the category files next to this one (the file
 * name matches the event's `category`). Recognition (1st Place, medals,
 * Final Round…) is stored ON the event, so one record feeds Did,
 * Recognized, All, Archive, Explore and the Skills proof lists.
 *
 * To add an event: add a record to the right category file. Nothing else
 * needs to change — every list, filter and page picks it up.
 */
export const events: WorkEvent[] = [
  ...entrepreneurshipEvents,
  ...leadershipEvents,
  ...academicEvents,
  ...globalEvents,
  ...communicationEvents,
  ...writingEvents,
  ...artsEvents,
  ...sportsEvents,
  ...schoolEvents,
];
