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
  const [importTitle, setImportTitle] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const visibleTitles = new Set(["Integrated Project Canvas", "Essential Schema"]);

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

  const importProject = async () => {
    if (!importTitle.trim() || !importUrl.trim()) return;
    setImporting(true);
    setImportError(null);

    try {
      const response = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: importTitle.trim(),
          url: importUrl.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Import failed");
      }

      const result = await response.json();
      if (result?.projectId) {
        window.location.href = `/projects/${result.projectId}`;
      }
    } catch (error: any) {
      console.error("Error importing project:", error);
      setImportError(error?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-2">Loading...</div>
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#007aff] rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-semibold mb-3 text-gray-900 tracking-tight">Claims Engine</h1>
        <p className="text-lg text-gray-700 mb-12 whitespace-pre-line">
          {"The Claims Engine is a graph-based system for connecting evidence to claims.\n\nIt lets teams organize documents, observations, decisions, and actions into structured relationships—showing not just what happened, but what was learned, how it was validated, and why it matters. Claims are built from evidence, supported by validation, and remain open to revision as conditions change.\n\nThis is an experimental, in-progress demo."}
        </p>

        {/* Create/import disabled for the public landing page */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.filter((project) => visibleTitles.has(project.title)).length === 0 ? (
            <div className="col-span-2 text-center py-16">
              <p className="text-gray-500 text-lg">No projects yet</p>
              <p className="text-gray-400 text-sm mt-2">Create your first project to get started</p>
            </div>
          ) : (
            projects
              .filter((project) => visibleTitles.has(project.title))
              .map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="apple-card block group"
              >
                <h2 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-[#007aff] transition-colors">{project.title}</h2>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">{project.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

