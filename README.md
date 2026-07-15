<div align="center">
  <img src="https://cheapsystem.run.place/favicon.svg" alt="CheapSystem Logo" width="80" height="80" />
  <h1>CheapSystem Designer</h1>
  <p><strong>Draft, Simulate, Optimize</strong></p>
  <p>A free, interactive system design simulator and architecture diagramming tool built for engineers.</p>

  <div>
    <a href="https://cheapsystem.run.place/"><strong>Start Designing</strong></a> · 
    <a href="https://cheapsystem.run.place/docs"><strong>Documentation</strong></a> · 
    <a href="https://cheapsystem.run.place/blog"><strong>Blog</strong></a>
  </div>
</div>

<br />

## 🚀 Overview

**CheapSystem** is an interactive, browser-based system design simulator. It allows software engineers and architects to drag and drop components to visualize and simulate distributed architectures, test load balancers, caching layers, and database clusters.

Unlike static diagramming tools, CheapSystem features a **simulation engine** that lets you visualize real-time traffic flow (QPS), buffer bottlenecks, and request routing across your system.

## ✨ Features

- **Interactive Canvas**: Drag and drop Load Balancers, API Gateways, Microservices, Databases, Caches, and CDNs onto the canvas.
- **Traffic Simulation**: Adjust QPS limits and watch requests flow through your architecture in real-time. Identify bottlenecks instantly.
- **Smart Edge Routing**: Connect nodes to establish communication. The system intelligently handles bi-directional data flow (e.g., Cache hits/misses).
- **Preset Architectures**: Start quickly with pre-built templates for common architectures (e.g., standard microservices, caching layers).
- **Save & Export**: Your designs persist locally in the browser. You can easily share or export them.
- **Built-in Knowledge Base**: Integrated technical documentation and an engineering blog to learn more about distributed systems.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Canvas/Graph Engine**: [React Flow](https://reactflow.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [Wouter](https://github.com/molefrog/wouter)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Parsing**: [Marked](https://marked.js.org/)

## 💻 Local Development

To run the CheapSystem Designer locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aryankrsingh004/CheapSystem.git
   cd CheapSystem
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev
   ```

4. **Build for production:**
   ```bash
   pnpm run build
   ```

## 📖 Learn More

- **[System Design Documentation](https://cheapsystem.run.place/docs)**: Learn how to use the tool and the principles behind the simulated components.
- **[Engineering Blog](https://cheapsystem.run.place/blog)**: Read our deep dives into topics like Kafka, Redis, Load Balancing, and the CAP Theorem.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for new components, improved simulation logic, or better preset templates, feel free to open an issue or submit a pull request.

## 📄 License

This project is open-source and available for free.
