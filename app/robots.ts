import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/'], // Disallow crawling of private areas and APIs
        },
        sitemap: 'https://dev-keep.vercel.app/sitemap.xml',
    }
}
