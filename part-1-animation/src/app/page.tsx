'use client';

import { Collection } from '@/components/Collection/Collection';
import { Hero } from '@/components/Hero/Hero';
import { Preloader } from '@/components/Preloader/Preloader';
import { SmoothScroll } from '@/components/SmoothScroll/SmoothScroll';

/**
 * One page, three sections. No routing, no real navigation — per the brief.
 *
 * Suggested build order:
 *   1. Hero (static layout first, animation second)
 *   2. Collection
 *   3. Preloader last — it's easiest to build once there's something to reveal
 */
export default function Page() {
  return (
    <SmoothScroll>
      <Preloader />
      <main>
        <Hero />
        <Collection />
      </main>
    </SmoothScroll>
  );
}
