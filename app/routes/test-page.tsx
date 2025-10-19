import type { Route } from "./+types/test-page";
import { useEffect, useState } from "react";

// Page metadata
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Test Page - React Router Demo" },
    { name: "description", content: "A test page to demonstrate React Router v7 page creation" },
  ];
}

// Data loader - runs on server
export async function loader({ context }: Route.LoaderArgs) {
  // Simulate API call or database query
  return {
    message: "Hello from the server!",
    timestamp: new Date().toISOString(),
    features: [
      "React Router v7",
      "Hono Backend",
      "Cloudflare D1 Database",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui Components"
    ]
  };
}

// Main page component
export default function TestPage({ loaderData }: Route.ComponentProps) {
  const { message, timestamp, features } = loaderData;
  const [clientMessage, setClientMessage] = useState("");

  useEffect(() => {
    // Client-side data fetching example
    fetch("/api/test")
      .then(res => res.json())
      .then(data => {
        const responseData = data as { success: boolean; data: { message: string }; error?: string };
        if (responseData.success) {
          setClientMessage(responseData.data.message);
        }
      })
      .catch(error => {
        console.error("Failed to fetch test data:", error);
        setClientMessage("Failed to load client data");
      });
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Test Page
          </h1>
          <p className="text-lg text-gray-600">
            This page demonstrates React Router v7 page creation patterns
          </p>
        </div>

        {/* Server Data Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Server-Side Data
          </h2>
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-medium">Message:</span> {message}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Loaded at:</span> {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Client Data Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Client-Side Data
          </h2>
          <p className="text-gray-700">
            {clientMessage || "Loading client data..."}
          </p>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Tech Stack Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
              >
                <span className="text-blue-800 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Navigation
          </h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Home
            </a>
            <a
              href="/todo"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📝 Todo List
            </a>
            <a
              href="/test-page"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh This Page
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>This test page was created following React Router v7 conventions</p>
        </div>
      </div>
    </div>
  );
}