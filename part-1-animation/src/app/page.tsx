'use client';

import { useState } from 'react';

import { Collection } from '@/components/Collection/Collection';
import { Hero } from '@/components/Hero/Hero';
import { Preloader } from '@/components/Preloader/Preloader';
import { SmoothScroll } from '@/components/SmoothScroll/SmoothScroll';

/**
 * One page, three sections. No routing, no real navigation — per the brief.
 *
 * `introReady` is the handoff between the loader and the hero: the preloader
 * flips it as its exit wipe begins, and the hero's entrance timeline waits on
 * it. Keeping that state here rather than inside either component means
 * neither has to know about the other.
 */
export default function Page() {
  const [introReady, setIntroReady] = useState(false);

  return (
    <SmoothScroll>
      <Preloader onComplete={() => setIntroReady(true)} />
      <main>
        <Hero introReady={introReady} />
        <Collection />
      </main>
    </SmoothScroll>
  );
}
