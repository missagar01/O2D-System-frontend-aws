"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
import { AUTH_BASE_URL, axiosConfig } from "@/config/api";

const initialForm = {
  username: "",
  password: "",
  access: "",
  supervisor_name: "",
  item_name: "",
  quality_controller: "",
  role: "",
  loading_incharge: "",
};

export function RegisterView() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(`${AUTH_BASE_URL}/auth/register`, form, { ...axiosConfig });
      const result = res.data;
      if (!result?.success) {
        throw new Error(result?.error || "Registration failed");
      }

      setSuccess("Registration successful.");
      setForm(initialForm);
      // Stay on the registration page; do not auto-redirect
    } catch (err: any) {
      setError(err?.message || "Unable to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="border-purple-200 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-gradient">
            Create Account
          </CardTitle>
          <CardDescription>
            Register a new user for the O2D System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Enter username"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Enter password"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access">Access</Label>
              <Input
                id="access"
                value={form.access}
                onChange={(e) => handleChange("access", e.target.value)}
                placeholder="all or comma separated pages"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor_name">Supervisor Name</Label>
              <Input
                id="supervisor_name"
                value={form.supervisor_name}
                onChange={(e) => handleChange("supervisor_name", e.target.value)}
                placeholder="Supervisor name"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={form.item_name}
                onChange={(e) => handleChange("item_name", e.target.value)}
                placeholder="Item name"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality_controller">Quality Controller</Label>
              <Input
                id="quality_controller"
                value={form.quality_controller}
                onChange={(e) => handleChange("quality_controller", e.target.value)}
                placeholder="Quality controller"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                placeholder="Role"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loading_incharge">Loading Incharge</Label>
              <Input
                id="loading_incharge"
                value={form.loading_incharge}
                onChange={(e) => handleChange("loading_incharge", e.target.value)}
                placeholder="Loading incharge"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="md:col-span-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="md:col-span-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
                {success}
              </div>
            )}

            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
