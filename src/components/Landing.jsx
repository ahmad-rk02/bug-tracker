// src/components/Landing.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiLayers,
  FiSearch,
  FiActivity,
} from "react-icons/fi";
import AuthModal from "./auth/AuthModal";

const features = [
  {
    icon: <FiLayers />,
    title: "Kanban Boards",
    desc: "Drag & drop issues across To Do, In Progress and Done.",
  },
  {
    icon: <FiUsers />,
    title: "Team Collaboration",
    desc: "Assign tickets, comment and work together easily.",
  },
  {
    icon: <FiSearch />,
    title: "Smart Filters",
    desc: "Filter by status, priority, assignee or keyword.",
  },
  {
    icon: <FiActivity />,
    title: "Real-Time Workflow",
    desc: "Track progress clearly like Jira or Linear.",
  },
];

const Landing = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState("login");

  // Optional: auto-open modal if user comes from ?auth=... query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");
    if (authParam && ["login", "register", "forgot"].includes(authParam)) {
      setInitialTab(authParam);
      setAuthModalOpen(true);
    }
  }, []);

  const openModal = (tab = "login") => {
    setInitialTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-16 py-5 bg-gradient-to-b from-black/70 to-transparent backdrop-blur-md"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-indigo-400 tracking-tight">
          Bug Tracker
        </h1>

        <div className="flex items-center gap-5 md:gap-7 text-sm">
          <button
            onClick={() => openModal("login")}
            className="text-gray-200 hover:text-indigo-300 transition-colors font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => openModal("register")}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
          >
            Get Started Free
          </button>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-20 md:pt-0">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6"
        >
          Track Bugs.
          <span className="block md:inline text-indigo-400"> Ship Faster.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10"
        >
          Modern, clean issue tracking — inspired by Jira and Linear.  
          Built for teams that move fast.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <button
            onClick={() => openModal("register")}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-medium rounded-xl transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50"
          >
            Get Started — It's Free
          </button>

          <button
            onClick={() => openModal("login")}
            className="text-indigo-400 hover:text-indigo-300 text-lg font-medium transition-colors"
          >
            or Sign In
          </button>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 md:px-16 bg-slate-900/40">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Built for <span className="text-indigo-400">flow</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="bg-slate-800/70 backdrop-blur-sm p-7 rounded-2xl border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-900/20"
            >
              <div className="text-4xl text-indigo-400 mb-5">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-gray-500 border-t border-slate-800 bg-slate-950">
        <p className="text-sm">
          © {new Date().getFullYear()} BugTracker. All rights reserved. Made by Ahmad Raza Khan.
        </p>
      </footer>

      {/* ── SINGLE AUTH MODAL (with tabs inside) ── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={initialTab}
      />
    </div>
  );
};

export default Landing;