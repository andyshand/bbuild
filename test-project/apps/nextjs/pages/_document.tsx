import { isNumber } from "@bbuild/dash";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  const gotNumber = isNumber(323);
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        number {gotNumber ? "Is a number" : "Not a number"}
      </body>
    </Html>
  );
}
