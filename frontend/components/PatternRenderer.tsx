"use client";
import ReactMarkdown from "react-markdown";
import { MarkMapRenderer } from "./MarkMapRenderer";

interface PatternRendererProps {
  result: any;
  pattern: string;
  recipeName: string;
}

function MindMapRenderer({ result }: { result: any }) {
  if (!result?.central_topic || !result?.main_branches) {
    return <ReactMarkdown>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</ReactMarkdown>;
  }

  return (
    <div className="mind-map-result">
      <div className="central-topic">
        <h2>🧠 {result.central_topic}</h2>
      </div>
      
      <div className="main-branches">
        {result.main_branches.map((branch: any, idx: number) => (
          <div key={idx} className="branch">
            <h3 style={{color: branch.color || 'var(--accent)'}}>{branch.name}</h3>
            <div className="sub-branches">
              {branch.sub_branches?.map((sub: any, subIdx: number) => (
                <div key={subIdx} className="sub-branch">
                  <h4>{sub.name}</h4>
                  {sub.details && (
                    <ul>
                      {sub.details.map((detail: string, detailIdx: number) => (
                        <li key={detailIdx}>{detail}</li>
                      ))}
                    </ul>
                  )}
                  {sub.connections && sub.connections.length > 0 && (
                    <div className="connections">
                      <small>🔗 Connects to: {sub.connections.join(', ')}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {result.key_insights && result.key_insights.length > 0 && (
        <div className="key-insights">
          <h3>💡 Key Insights</h3>
          <ul>
            {result.key_insights.map((insight: string, idx: number) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {result.cross_connections && result.cross_connections.length > 0 && (
        <div className="cross-connections">
          <h3>🔄 Cross Connections</h3>
          {result.cross_connections.map((conn: any, idx: number) => (
            <div key={idx} className="connection">
              <strong>{conn.from}</strong> → <strong>{conn.to}</strong>
              <br /><small>{conn.relationship}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IterativeDebateRenderer({ result }: { result: any }) {
  if (!result?.final_synthesis) {
    return <ReactMarkdown>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</ReactMarkdown>;
  }

  return (
    <div className="debate-result">
      {result.process_summary && (
        <div className="process-summary">
          <h3>🔄 Process Summary</h3>
          <ReactMarkdown>{result.process_summary}</ReactMarkdown>
        </div>
      )}

      <div className="final-synthesis">
        <h3>⚖️ Final Synthesis</h3>
        <ReactMarkdown>{result.final_synthesis}</ReactMarkdown>
      </div>

      {result.actionable_recommendations && (
        <div className="recommendations">
          <h3>🎯 Actionable Recommendations</h3>
          <ReactMarkdown>{result.actionable_recommendations}</ReactMarkdown>
        </div>
      )}

      {result.loop_history && result.loop_history.length > 0 && (
        <details className="loop-history">
          <summary>📜 View Process History ({result.loop_history.length} loops)</summary>
          {result.loop_history.map((loop: any, idx: number) => (
            <div key={idx} className="loop">
              <h4>Loop {idx + 1}</h4>
              {loop.steps?.map((step: any, stepIdx: number) => (
                <div key={stepIdx} className="step">
                  <strong>{step.role}:</strong>
                  <div className="step-content">
                    {typeof step.content === 'string' ? (
                      <ReactMarkdown>{step.content}</ReactMarkdown>
                    ) : (
                      <pre>{JSON.stringify(step.content, null, 2)}</pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

function ParallelRenderer({ result }: { result: any }) {
  if (!result?.synthesis && !result?.branches) {
    return <ReactMarkdown>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</ReactMarkdown>;
  }

  return (
    <div className="parallel-result">
      {result.branches && (
        <div className="parallel-branches">
          <h3>🌳 Parallel Exploration</h3>
          {result.branches.map((branch: any, idx: number) => (
            <div key={idx} className="branch-result">
              <h4>{branch.branch_name || `Branch ${idx + 1}`}</h4>
              <div className="branch-content">
                {typeof branch === 'string' ? (
                  <ReactMarkdown>{branch}</ReactMarkdown>
                ) : (
                  <pre>{JSON.stringify(branch, null, 2)}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {result.synthesis && (
        <div className="synthesis">
          <h3>🔄 Synthesis</h3>
          {typeof result.synthesis === 'string' ? (
            <ReactMarkdown>{result.synthesis}</ReactMarkdown>
          ) : (
            <pre>{JSON.stringify(result.synthesis, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineRenderer({ result }: { result: any }) {
  // Handle timeline/sequential data
  if (!result?.timeline && !result?.steps && !result?.sequence) {
    return <DefaultRenderer result={result} />;
  }

  const timelineData = result.timeline || result.steps || result.sequence || [];

  return (
    <div className="timeline-result">
      <div className="timeline">
        {timelineData.map((item: any, idx: number) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-marker">{idx + 1}</div>
            <div className="timeline-content">
              <h4>{item.title || item.step || item.phase || `Step ${idx + 1}`}</h4>
              {item.timeframe && (
                <div className="timeline-timeframe">📅 {item.timeframe}</div>
              )}
              <div className="timeline-description">
                {typeof item.description === 'string' ? (
                  <ReactMarkdown>{item.description}</ReactMarkdown>
                ) : item.content ? (
                  <ReactMarkdown>{item.content}</ReactMarkdown>
                ) : (
                  <pre>{JSON.stringify(item, null, 2)}</pre>
                )}
              </div>
              {item.actions && item.actions.length > 0 && (
                <div className="timeline-actions">
                  <h5>Actions:</h5>
                  <ul>
                    {item.actions.map((action: string, actionIdx: number) => (
                      <li key={actionIdx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {result.insights && (
        <div className="timeline-insights">
          <h3>💡 Key Insights</h3>
          <ReactMarkdown>{result.insights}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function MatrixRenderer({ result }: { result: any }) {
  // Handle matrix/dimensional analysis data
  if (!result?.matrix && !result?.dimensions && !result?.combinations) {
    return <DefaultRenderer result={result} />;
  }

  const matrixData = result.matrix || result.combinations || [];
  const dimensions = result.dimensions || [];

  return (
    <div className="matrix-result">
      {dimensions.length > 0 && (
        <div className="matrix-dimensions">
          <h3>📊 Analysis Dimensions</h3>
          <div className="dimensions-list">
            {dimensions.map((dim: any, idx: number) => (
              <div key={idx} className="dimension">
                <strong>{dim.name || dim.dimension}:</strong>
                <span className="dimension-values">
                  {Array.isArray(dim.values) ? dim.values.join(', ') : dim.options?.join(', ') || 'Various options'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="matrix-table">
        <h3>🔗 Combinations Analysis</h3>
        <div className="matrix-grid">
          {matrixData.map((combination: any, idx: number) => (
            <div key={idx} className="matrix-cell">
              <div className="combination-header">
                <strong>{combination.name || `Combination ${idx + 1}`}</strong>
                {combination.score && (
                  <span className="combination-score">Score: {combination.score}</span>
                )}
              </div>
              <div className="combination-details">
                {combination.parameters && (
                  <div className="parameters">
                    {Object.entries(combination.parameters).map(([key, value]) => (
                      <div key={key} className="parameter">
                        <span className="param-name">{key}:</span>
                        <span className="param-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {combination.description && (
                  <div className="combination-description">
                    <ReactMarkdown>{combination.description}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.recommendations && (
        <div className="matrix-recommendations">
          <h3>🎯 Recommendations</h3>
          <ReactMarkdown>{result.recommendations}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function ClusterRenderer({ result }: { result: any }) {
  // Handle clustered/grouped data
  if (!result?.clusters && !result?.groups && !result?.categories) {
    return <DefaultRenderer result={result} />;
  }

  const clusterData = result.clusters || result.groups || result.categories || [];

  return (
    <div className="cluster-result">
      <div className="clusters-container">
        {clusterData.map((cluster: any, idx: number) => (
          <div key={idx} className="cluster">
            <div className="cluster-header">
              <h3>{cluster.name || cluster.title || `Group ${idx + 1}`}</h3>
              {cluster.count && (
                <span className="cluster-count">{cluster.count} items</span>
              )}
            </div>
            
            <div className="cluster-items">
              {cluster.items?.map((item: any, itemIdx: number) => (
                <div key={itemIdx} className="cluster-item">
                  {typeof item === 'string' ? item : item.title || item.name || JSON.stringify(item)}
                </div>
              )) || cluster.ideas?.map((idea: string, ideaIdx: number) => (
                <div key={ideaIdx} className="cluster-item">{idea}</div>
              ))}
            </div>

            {cluster.theme && (
              <div className="cluster-theme">
                <strong>Theme:</strong> {cluster.theme}
              </div>
            )}

            {cluster.insights && (
              <div className="cluster-insights">
                <strong>Insights:</strong> <ReactMarkdown>{cluster.insights}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>

      {result.connections && result.connections.length > 0 && (
        <div className="cluster-connections">
          <h3>🔗 Inter-cluster Connections</h3>
          {result.connections.map((conn: any, idx: number) => (
            <div key={idx} className="connection">
              <strong>{conn.from}</strong> ↔ <strong>{conn.to}</strong>
              {conn.relationship && <span>: {conn.relationship}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GridRenderer({ result }: { result: any }) {
  // Handle grid/rapid concept data
  if (!result?.concepts && !result?.ideas && !result?.sketches) {
    return <DefaultRenderer result={result} />;
  }

  const gridData = result.concepts || result.ideas || result.sketches || [];

  return (
    <div className="grid-result">
      <div className="concepts-grid">
        {gridData.map((concept: any, idx: number) => (
          <div key={idx} className="concept-card">
            <div className="concept-number">{idx + 1}</div>
            <div className="concept-content">
              <h4>{concept.title || concept.name || `Concept ${idx + 1}`}</h4>
              {concept.description && (
                <p>{concept.description}</p>
              )}
              {concept.sketch && (
                <div className="concept-sketch">{concept.sketch}</div>
              )}
              {concept.tags && (
                <div className="concept-tags">
                  {concept.tags.map((tag: string, tagIdx: number) => (
                    <span key={tagIdx} className="concept-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {result.selected_concepts && (
        <div className="grid-selected">
          <h3>⭐ Selected Concepts</h3>
          <div className="selected-concepts">
            {result.selected_concepts.map((concept: any, idx: number) => (
              <div key={idx} className="selected-concept">
                <strong>{concept.title}</strong>: {concept.reason}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeRenderer({ result }: { result: any }) {
  // Handle recursive/hierarchical tree data
  if (!result?.tree && !result?.expansion && !result?.hierarchy) {
    return <DefaultRenderer result={result} />;
  }

  const treeData = result.tree || result.expansion || result.hierarchy;

  const renderTreeNode = (node: any, level: number = 0) => (
    <div key={node.id || node.name} className={`tree-node level-${level}`}>
      <div className="node-content">
        <h4>{node.name || node.title || node.question}</h4>
        {node.description && <p>{node.description}</p>}
        {node.details && (
          <div className="node-details">
            <ReactMarkdown>{node.details}</ReactMarkdown>
          </div>
        )}
      </div>
      {node.children && node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child: any) => renderTreeNode(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="tree-result">
      {Array.isArray(treeData) ? (
        treeData.map((rootNode: any, idx: number) => (
          <div key={idx} className="tree-root">
            {renderTreeNode(rootNode, 0)}
          </div>
        ))
      ) : (
        <div className="tree-root">
          {renderTreeNode(treeData, 0)}
        </div>
      )}

      {result.insights && (
        <div className="tree-insights">
          <h3>🌳 Expansion Insights</h3>
          <ReactMarkdown>{result.insights}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function PersonaRenderer({ result }: { result: any }) {
  // Handle role-based/persona perspectives
  if (!result?.perspectives && !result?.roles && !result?.personas) {
    return <DefaultRenderer result={result} />;
  }

  const personaData = result.perspectives || result.roles || result.personas || [];

  return (
    <div className="persona-result">
      <div className="personas-container">
        {personaData.map((persona: any, idx: number) => (
          <div key={idx} className="persona-card">
            <div className="persona-header">
              <div className="persona-avatar">
                {persona.emoji || persona.icon || '👤'}
              </div>
              <div className="persona-info">
                <h3>{persona.name || persona.role || `Perspective ${idx + 1}`}</h3>
                {persona.background && (
                  <p className="persona-background">{persona.background}</p>
                )}
              </div>
            </div>
            
            <div className="persona-perspective">
              {persona.viewpoint && (
                <div className="viewpoint">
                  <h4>🎭 Viewpoint</h4>
                  <ReactMarkdown>{persona.viewpoint}</ReactMarkdown>
                </div>
              )}
              
              {persona.ideas && (
                <div className="persona-ideas">
                  <h4>💡 Ideas</h4>
                  <ul>
                    {persona.ideas.map((idea: any, ideaIdx: number) => (
                      <li key={ideaIdx}>
                        {typeof idea === 'string' ? idea : idea.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {persona.concerns && (
                <div className="persona-concerns">
                  <h4>⚠️ Concerns</h4>
                  <ul>
                    {persona.concerns.map((concern: string, concernIdx: number) => (
                      <li key={concernIdx}>{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {result.synthesis && (
        <div className="persona-synthesis">
          <h3>🤝 Perspective Synthesis</h3>
          <ReactMarkdown>{result.synthesis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function DefaultRenderer({ result }: { result: any }) {
  if (typeof result === 'string') {
    return <ReactMarkdown>{result}</ReactMarkdown>;
  }

  // Try to find common result patterns
  if (result?.final_synthesis) {
    return <ReactMarkdown>{result.final_synthesis}</ReactMarkdown>;
  }

  if (result?.synthesis) {
    return <ReactMarkdown>{typeof result.synthesis === 'string' ? result.synthesis : JSON.stringify(result.synthesis, null, 2)}</ReactMarkdown>;
  }

  if (result?.output) {
    return <ReactMarkdown>{typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}</ReactMarkdown>;
  }

  // Fallback to JSON display
  return (
    <div className="json-result">
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export function PatternRenderer({ result, pattern, recipeName }: PatternRendererProps) {
  const lowerRecipeName = recipeName.toLowerCase();
  
  // Recipe-specific rendering (overrides pattern-based)
  if (lowerRecipeName.includes('mind map')) {
    return <MarkMapRenderer result={result} />;
  }
  
  if (lowerRecipeName.includes('crazy 8') || lowerRecipeName.includes('rapid ideation') || 
      lowerRecipeName.includes('brainwriting')) {
    return <GridRenderer result={result} />;
  }
  
  if (lowerRecipeName.includes('morphological matrix') || lowerRecipeName.includes('combination')) {
    return <MatrixRenderer result={result} />;
  }
  
  if (lowerRecipeName.includes('affinity mapping') || lowerRecipeName.includes('clustering') || 
      lowerRecipeName.includes('brain netting')) {
    return <ClusterRenderer result={result} />;
  }
  
  if (lowerRecipeName.includes('futuring backwards') || lowerRecipeName.includes('storyboard') || 
      lowerRecipeName.includes('lightning decision') || lowerRecipeName.includes('timeline')) {
    return <TimelineRenderer result={result} />;
  }
  
  if (lowerRecipeName.includes('lotus blossom') || lowerRecipeName.includes('starbursting') || 
      lowerRecipeName.includes('world café') || lowerRecipeName.includes('expansion')) {
    return <TreeRenderer result={result} />;
  }
  
  if (lowerRecipeName.includes('role storming') || lowerRecipeName.includes('synectics') || 
      lowerRecipeName.includes('persona') || lowerRecipeName.includes('perspective')) {
    return <PersonaRenderer result={result} />;
  }

  // Data structure-based detection (checks result structure)
  if (result?.timeline || result?.steps || result?.sequence) {
    return <TimelineRenderer result={result} />;
  }
  
  if (result?.matrix || result?.dimensions || result?.combinations) {
    return <MatrixRenderer result={result} />;
  }
  
  if (result?.clusters || result?.groups || result?.categories) {
    return <ClusterRenderer result={result} />;
  }
  
  if (result?.concepts || result?.ideas || result?.sketches) {
    return <GridRenderer result={result} />;
  }
  
  if (result?.tree || result?.expansion || result?.hierarchy) {
    return <TreeRenderer result={result} />;
  }
  
  if (result?.perspectives || result?.roles || result?.personas) {
    return <PersonaRenderer result={result} />;
  }
  
  if (result?.central_topic || result?.main_branches) {
    return <MarkMapRenderer result={result} />;
  }

  // Pattern-based rendering (fallback)
  switch (pattern) {
    case 'iterative':
      return <IterativeDebateRenderer result={result} />;
    
    case 'parallel':
      return <ParallelRenderer result={result} />;
    
    case 'chain':
    case 'orchestrator':
    case 'routing':
    case 'single_shot':
    default:
      return <DefaultRenderer result={result} />;
  }
}