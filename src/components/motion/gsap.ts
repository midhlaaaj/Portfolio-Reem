'use client';

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

/** The three curves the design uses everywhere, as cubic-beziers: out, in-out and the springy overshoot. */
export const OUT = CustomEase.create('rfOut', '0.16,1,0.3,1');
export const IO = CustomEase.create('rfIo', '0.76,0,0.24,1');
export const SPRING = CustomEase.create('rfSpring', '0.175,0.885,0.32,1.275');

export { gsap, ScrollTrigger, useGSAP };
