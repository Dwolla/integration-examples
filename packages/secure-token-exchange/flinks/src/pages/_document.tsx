import createEmotionServer from "@emotion/server/create-instance";
import type { DocumentContext } from "next/document";
import Document, { Head, Html, Main, NextScript } from "next/document";
import createEmotionCache from "../createEmotionCache";
import theme from "../theme";

export default class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const originalRenderPage = ctx.renderPage;

        const cache = createEmotionCache();
        const { extractCriticalToChunks } = createEmotionServer(cache);

        ctx.renderPage = () =>
            originalRenderPage({
                enhanceApp: (App) =>
                    function EnhancedApp(props: any) {
                        return <App emotionCache={cache} {...props} />;
                    }
            });

        const initialProps = await Document.getInitialProps(ctx);
        const emotionStyles = extractCriticalToChunks(initialProps.html);
        const emotionStyleTags = emotionStyles.styles.map((style) => (
            <style
                data-emotion={`${style.key} ${style.ids.join(" ")}`}
                key={style.key}
                dangerouslySetInnerHTML={{ __html: style.css }}
            />
        ));

        return {
            ...initialProps,
            emotionStyleTags
        };
    }

    render() {
        return (
            <Html lang="en">
                <Head>
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
                    />
                    <meta name="emotion-insertion-point" content="" />
                    <meta name="theme-color" content={theme.palette.primary.main} />
                    {(this.props as any).emotionStyleTags}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
