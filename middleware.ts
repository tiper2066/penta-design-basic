import { withAuth } from "next-auth/middleware"

export default withAuth({
    pages: {
        signIn: "/login",
    },
})

export const config = {
    // Define protected routes here
    // The root path "/" is NOT included, so it remains public
    matcher: [
        "/work/:path*",
        "/source/:path*",
        "/template/:path*",
        "/brochure/:path*",
        "/code-generator/:path*",
        // Add other protected paths as needed
    ],
}
