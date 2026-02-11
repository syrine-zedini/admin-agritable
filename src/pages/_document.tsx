import { Html, Head, Main, NextScript } from "next/document";
import ReactQueryProvider from "../providers/reactQueryProvider";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <ReactQueryProvider>
        <body className="antialiased">
          <Main />
          <NextScript />
        </body>
      </ReactQueryProvider>
    </Html>
  );
}
