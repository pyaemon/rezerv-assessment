/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 16 generates editor tooling files in the project root on `next dev`.
  // Not part of this project, so opt out.
  agentRules: false,
};

export default nextConfig;
