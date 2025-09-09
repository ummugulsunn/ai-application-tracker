import { Metadata } from 'next';
import './swagger-ui.css';

export const metadata: Metadata = {
  title: 'API Documentation - AI Application Tracker',
  description: 'Interactive API documentation for the AI Application Tracker system',
  keywords: ['API', 'documentation', 'OpenAPI', 'Swagger', 'REST API', 'job applications'],
  robots: 'noindex, nofollow', // Prevent indexing of API docs
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}