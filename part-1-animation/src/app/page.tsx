'use client';

import { useState } from 'react';

import { Collection } from '@/components/Collection/Collection';
import { Hero } from '@/components/Hero/Hero';
import { Preloader } from '@/components/Preloader/Preloader';
import { SmoothScroll } from '@/components/SmoothScroll/SmoothScroll';

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
