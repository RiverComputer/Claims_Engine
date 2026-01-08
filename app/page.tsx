"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectTitle, setNewProjectTitle] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) return;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newProjectTitle }),
      });

      if (response.ok) {
        const project = await response.json();
        window.location.href = `/projects/${project.id}`;
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Claims Engine v2</h1>

        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && createProject()}
              placeholder="New project title"
              className="flex-1 px-4 py-2 border border-gray-300 rounded"
            />
            <button
              onClick={createProject}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="text-gray-500">No projects yet. Create one to get started.</div>
          ) : (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-white border border-gray-300 rounded-lg p-4 hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

