"use client";

import React, { useEffect } from 'react';
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export function CustomStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .swal2-popup {
        font-family: ${inter.style.fontFamily} !important;
      }
      .swal2-title {
        color: #f97316 !important;
      }
      .swal2-confirm {
        background-color: #f97316 !important;
        border: none !important;
      }
      .swal2-confirm:hover {
        background-color: #ea580c !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}