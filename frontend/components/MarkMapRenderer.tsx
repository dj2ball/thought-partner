"use client";
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface MarkMapRendererProps {
  result: any;
}

function convertToMarkdown(data: any): string {
  if (!data?.central_topic || !data?.main_branches) {
    return '# Invalid mindmap data';
  }

  let markdown = `# ${data.central_topic}\n\n`;

  data.main_branches.forEach((branch: any) => {
    markdown += `## ${branch.name}\n\n`;
    
    if (branch.sub_branches) {
      branch.sub_branches.forEach((subBranch: any) => {
        markdown += `### ${subBranch.name}\n\n`;
        
        if (subBranch.details && subBranch.details.length > 0) {
          subBranch.details.forEach((detail: string) => {
            markdown += `- ${detail}\n`;
          });
          markdown += '\n';
        }
        
        if (subBranch.connections && subBranch.connections.length > 0) {
          markdown += `#### 🔗 Connections\n`;
          subBranch.connections.forEach((connection: string) => {
            markdown += `- ${connection}\n`;
          });
          markdown += '\n';
        }
      });
    }
  });

  // Add key insights section
  if (data.key_insights && data.key_insights.length > 0) {
    markdown += `## 💡 Key Insights\n\n`;
    data.key_insights.forEach((insight: string) => {
      markdown += `- ${insight}\n`;
    });
    markdown += '\n';
  }

  // Add cross connections
  if (data.cross_connections && data.cross_connections.length > 0) {
    markdown += `## 🔄 Cross Connections\n\n`;
    data.cross_connections.forEach((conn: any) => {
      markdown += `### ${conn.from} → ${conn.to}\n`;
      markdown += `- ${conn.relationship}\n\n`;
    });
  }

  return markdown;
}

function MarkMapVisualization({ result }: MarkMapRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markmapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function loadMarkmap() {
      try {
        if (!svgRef.current || !mounted) return;

        // Dynamic import to avoid SSR issues
        const [{ Markmap }, { Transformer }] = await Promise.all([
          import('markmap-view'),
          import('markmap-lib')
        ]);

        if (!mounted) return;

        const transformer = new Transformer();
        const markdown = convertToMarkdown(result);
        const { root } = transformer.transform(markdown);

        // Clean up previous markmap instance
        if (markmapRef.current && typeof markmapRef.current.destroy === 'function') {
          markmapRef.current.destroy();
        }

        // Create new markmap instance with custom styles
        const mm = Markmap.create(svgRef.current, {
          duration: 500,
          maxWidth: 400,  // Increased for better readability
          spacingVertical: 10,  // More vertical spacing
          spacingHorizontal: 120,  // More horizontal spacing
          autoFit: true,
          pan: true,
          zoom: true,
          initialExpandLevel: 2,  // Start with 2 levels expanded
          color: (node: any) => {
            // Use depth-based colors
            const colors = ['#7c5cff', '#9b7fff', '#baa3ff', '#d9c7ff'];
            return colors[node.depth % colors.length];
          },
        });

        // Set the data
        mm.setData(root);
        mm.fit();

        // Apply custom styles to ensure text visibility
        const style = document.createElement('style');
        style.textContent = `
          .markmap-node-text { 
            fill: #ffffff !important; 
            font-size: 16px !important;
            font-weight: 400;
          }
          .markmap-node[data-depth="0"] .markmap-node-text {
            font-size: 20px !important;
            font-weight: 600;
            fill: #ffffff !important;
          }
          .markmap-node[data-depth="1"] .markmap-node-text {
            font-size: 18px !important;
            font-weight: 500;
            fill: #ffffff !important;
          }
          .markmap-node-circle { 
            fill: #7c5cff !important; 
            stroke: #7c5cff !important;
          }
          .markmap-link { 
            stroke: #2a2a32 !important; 
            stroke-width: 2px !important;
          }
          .markmap-node {
            cursor: pointer;
          }
          .markmap-node:hover .markmap-node-text {
            fill: #ffffff !important;
            font-weight: 500;
            text-shadow: 0 0 8px rgba(124, 92, 255, 0.8);
          }
          .markmap-foreign-object {
            overflow: visible !important;
          }
          .markmap-node text {
            fill: #ffffff !important;
          }
        `;
        svgRef.current.appendChild(style);

        markmapRef.current = mm;
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Failed to load markmap:', err);
        setError('Failed to load interactive mindmap');
        setIsLoaded(false);
      }
    }

    loadMarkmap();

    return () => {
      mounted = false;
      if (markmapRef.current && typeof markmapRef.current.destroy === 'function') {
        markmapRef.current.destroy();
        markmapRef.current = null;
      }
    };
  }, [result]);

  if (error) {
    return (
      <div className="markmap-error">
        <p>⚠️ {error}</p>
        <details>
          <summary>View as text mindmap</summary>
          <div className="mind-map-result">
            <div className="central-topic">
              <h2>🧠 {result.central_topic}</h2>
            </div>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </details>
      </div>
    );
  }

  const handleZoom = (factor: number) => {
    if (markmapRef.current) {
      markmapRef.current.rescale(factor);
      setZoomLevel(prev => prev * factor);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFitToView = () => {
    if (markmapRef.current) {
      markmapRef.current.fit();
      setZoomLevel(1);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`markmap-viz-container ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {!isLoaded && (
        <div className="markmap-loading">
          <div className="spinner"></div>
          <p>Loading interactive mindmap...</p>
        </div>
      )}
      
      <div className="markmap-controls-overlay">
        <button onClick={handleFitToView} className="markmap-control-btn" title="Fit to view">
          🎯
        </button>
        <button onClick={() => handleZoom(1.5)} className="markmap-control-btn" title="Zoom in">
          ➕
        </button>
        <button onClick={() => handleZoom(0.67)} className="markmap-control-btn" title="Zoom out">
          ➖
        </button>
        <button onClick={handleFullscreen} className="markmap-control-btn" title="Toggle fullscreen">
          {isFullscreen ? '🗙' : '⛶'}
        </button>
        <span className="zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
      </div>
      
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: isFullscreen ? '100vh' : '700px',  // Increased height
          border: '1px solid var(--border)',
          borderRadius: isFullscreen ? '0' : '8px',
          backgroundColor: 'var(--background)',
          display: isLoaded ? 'block' : 'none',
        }}
      />
      
      <div className="markmap-tips">
        <small>💡 Tip: Click nodes to expand/collapse • Scroll to zoom • Drag to pan • Press ⛶ for fullscreen</small>
      </div>
    </div>
  );
}

export function MarkMapRenderer({ result }: MarkMapRendererProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debug logging
  console.log('MarkMapRenderer - Received result:', result);
  console.log('MarkMapRenderer - Has central_topic?', !!result?.central_topic);
  console.log('MarkMapRenderer - Has main_branches?', !!result?.main_branches);
  console.log('MarkMapRenderer - Result keys:', Object.keys(result || {}));

  // Fallback to old renderer if markmap data is invalid
  if (!result?.central_topic || !result?.main_branches) {
    return (
      <div className="mind-map-result">
        <div className="central-topic">
          <h2>🧠 {result?.central_topic || 'Invalid Mindmap Data'}</h2>
        </div>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    );
  }

  // Only render on client side to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="markmap-loading">
        <div className="spinner"></div>
        <p>Loading mindmap...</p>
      </div>
    );
  }

  return (
    <div className="markmap-container">
      <div className="markmap-header">
        <h2>🧠 {result.central_topic}</h2>
      </div>
      
      <div className="markmap-wrapper">
        <MarkMapVisualization result={result} />
      </div>

      {/* Optional: Show raw data toggle */}
      <details className="markmap-raw-data">
        <summary>📋 View Raw Data</summary>
        <pre className="markmap-json">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}