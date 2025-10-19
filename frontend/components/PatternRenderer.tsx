"use client";
import ReactMarkdown from "react-markdown";
import { MarkMapRenderer } from "./MarkMapRenderer";
import { useState } from "react";

interface PatternRendererProps {
  result: any;
  pattern?: string;
  recipeName?: string;
}

function MethodologyCard({ methodology, recipeName }: { methodology: any; recipeName: string }) {
  if (!methodology) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1) 0%, rgba(124, 92, 255, 0.05) 100%)',
      border: '1px solid rgba(124, 92, 255, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        color: 'var(--accent)',
        fontSize: '1.1rem',
        fontWeight: '600'
      }}>
        📚 About {recipeName}
      </h3>

      {methodology.overview && (
        <p style={{
          margin: '0 0 1rem 0',
          color: 'var(--foreground)',
          lineHeight: '1.6'
        }}>
          {methodology.overview}
        </p>
      )}

      {methodology.value && (
        <div style={{ marginBottom: '1rem' }}>
          <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>💡 Value:</strong>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: 'var(--foreground)',
            lineHeight: '1.6',
            fontSize: '0.95rem'
          }}>
            {methodology.value}
          </p>
        </div>
      )}

      {methodology.process && (
        <div>
          <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>⚙️ Process:</strong>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: 'var(--foreground)',
            lineHeight: '1.6',
            fontSize: '0.95rem'
          }}>
            {methodology.process}
          </p>
        </div>
      )}
    </div>
  );
}

function ProcessSteps({ steps }: { steps: any[] }) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  if (!steps || steps.length === 0) {
    return null;
  }

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatStepName = (stepId: string) => {
    return stepId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderStepContent = (output: any) => {
    if (!output) return null;

    // Handle arrays of items (sabotages, solutions, concepts, etc.)
    const arrayFields = Object.keys(output).filter(key => Array.isArray(output[key]));

    return (
      <div style={{ padding: '1rem' }}>
        {arrayFields.map((fieldName, idx) => (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            <div style={{
              fontWeight: '600',
              marginBottom: '0.5rem',
              textTransform: 'capitalize',
              color: 'var(--accent)'
            }}>
              {fieldName.replace(/_/g, ' ')}:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {output[fieldName].map((item: any, itemIdx: number) => (
                <div key={itemIdx} style={{
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--accent)',
                  color: 'var(--muted)',
                  fontSize: '0.9rem'
                }}>
                  {typeof item === 'string' ? (
                    <div>{item}</div>
                  ) : (
                    Object.entries(item).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '0.25rem' }}>
                        <strong style={{ textTransform: 'capitalize', color: 'var(--text)' }}>
                          {key.replace(/_/g, ' ')}:
                        </strong>{' '}
                        {Array.isArray(value) ? (
                          <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                            {value.map((v: any, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        ) : (
                          <span>{String(value)}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="process-steps" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>💭 Thinking Process</h3>
      <div className="steps-container">
        {steps.map((stepData: any, idx: number) => {
          const stepName = formatStepName(stepData.step);
          const isExpanded = expandedSteps[idx];

          return (
            <div key={idx} className="process-step" style={{
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginBottom: '0.5rem',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => toggleStep(idx)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#ffffff'
                }}
              >
                <span style={{ color: '#ffffff' }}>
                  Step {idx + 1}: {stepName}
                </span>
                <span style={{ color: '#ffffff' }}>{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div style={{
                  background: 'var(--bg-primary)',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  {renderStepContent(stepData.output)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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
  // Extract output and steps from the result structure
  // After Composer processing, steps are at result.steps and data is at result level
  const outputData = result;
  const steps = result.steps || [];

  console.log('GridRenderer - Full result:', result);
  console.log('GridRenderer - outputData:', outputData);
  console.log('GridRenderer - steps:', steps);
  console.log('GridRenderer - steps.length:', steps.length);

  // Handle grid/rapid concept data
  if (!outputData?.concepts && !outputData?.ideas && !outputData?.sketches && !outputData?.developed_concepts) {
    return <DefaultRenderer result={result} />;
  }

  const gridData = outputData.concepts || outputData.ideas || outputData.sketches || outputData.developed_concepts || [];

  console.log('GridRenderer - gridData:', gridData);
  console.log('GridRenderer - gridData.length:', gridData.length);

  return (
    <div className="grid-result">
      {steps.length > 0 && <ProcessSteps steps={steps} />}

      {gridData.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>✨ Final Solutions</h3>
        </div>
      )}

      <div className="concepts-grid">
        {gridData.map((concept: any, idx: number) => (
          <div key={idx} className="concept-card">
            <div className="concept-number">{idx + 1}</div>
            <div className="concept-content">
              <h4>{concept.title || concept.name || `Concept ${idx + 1}`}</h4>

              {concept.borrowed_from && (
                <div className="concept-meta">
                  <strong>🎨 Inspired by:</strong> {concept.borrowed_from}
                </div>
              )}

              {concept.why_compelling && (
                <div className="concept-compelling">
                  <strong>💡 Why compelling:</strong> {concept.why_compelling}
                </div>
              )}

              {concept.description && (
                <p>{concept.description}</p>
              )}

              {concept.implementation && (
                <div className="concept-implementation">
                  <strong>🔧 Implementation:</strong> {concept.implementation}
                </div>
              )}

              {concept.challenges && (
                <div className="concept-challenges">
                  <strong>⚠️ Challenges:</strong> {concept.challenges}
                </div>
              )}

              {concept.one_liner && (
                <div className="concept-one-liner">
                  <strong>📝 One-liner:</strong> {concept.one_liner}
                </div>
              )}

              {concept.why_it_matters && (
                <div className="concept-why-matters">
                  <strong>💎 Why it matters:</strong> {concept.why_it_matters}
                </div>
              )}

              {concept.why_priority && (
                <div className="concept-why-priority">
                  <strong>⭐ Why priority:</strong> {concept.why_priority}
                </div>
              )}

              {concept.priority_score && (
                <div className="concept-priority">
                  <strong>📊 Priority:</strong> {concept.priority_score}
                </div>
              )}

              {concept.strength_rating && (
                <div className="concept-strength">
                  <strong>💪 Strength:</strong> {concept.strength_rating}/10
                </div>
              )}

              {concept.effort_estimate && (
                <div className="concept-effort">
                  <strong>⏱️ Effort:</strong> {concept.effort_estimate}
                </div>
              )}

              {concept.quick_win && (
                <div className="concept-quick-win">
                  <strong>🎯 Quick win:</strong> {concept.quick_win}
                </div>
              )}

              {concept.next_step && (
                <div className="concept-next-step">
                  <strong>➡️ Next step:</strong> {concept.next_step}
                </div>
              )}

              {concept.first_steps && concept.first_steps.length > 0 && (
                <div className="concept-first-steps">
                  <strong>🚀 First steps:</strong>
                  <ul>
                    {concept.first_steps.map((step: string, stepIdx: number) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {concept.success_metrics && concept.success_metrics.length > 0 && (
                <div className="concept-metrics">
                  <strong>📈 Success metrics:</strong>
                  <ul>
                    {concept.success_metrics.map((metric: string, metricIdx: number) => (
                      <li key={metricIdx}>{metric}</li>
                    ))}
                  </ul>
                </div>
              )}

              {concept.obstacles && (
                <div className="concept-obstacles">
                  <strong>🚧 Obstacles:</strong> {concept.obstacles}
                </div>
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

      {outputData.selected_concepts && (
        <div className="grid-selected">
          <h3>⭐ Selected Concepts</h3>
          <div className="selected-concepts">
            {outputData.selected_concepts.map((concept: any, idx: number) => (
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
  const lowerRecipeName = (recipeName || result?.recipe_id || '').toLowerCase();

  // Handle chain recipes with steps (show methodology + process + final output)
  if (result?.steps && result?.output) {
    return (
      <div>
        {result?.methodology && (
          <MethodologyCard methodology={result.methodology} recipeName={result.recipe_id || recipeName || 'This Technique'} />
        )}
        <ProcessSteps steps={result.steps} />
        <div style={{ marginTop: '2rem' }}>
          <PatternRenderer result={result.output} pattern={pattern} recipeName={recipeName} />
        </div>
      </div>
    );
  }

  // Recipe-specific rendering (overrides pattern-based)
  if (lowerRecipeName.includes('mind map') || lowerRecipeName.includes('mind_map') || lowerRecipeName.includes('mindmap')) {
    // Unwrap if data is in output field (from conversational agent)
    const mindmapData = result?.output?.central_topic ? result.output : result;
    return <MarkMapRenderer result={mindmapData} />;
  }
  
  if (lowerRecipeName.includes('crazy 8') || lowerRecipeName.includes('rapid ideation') ||
      lowerRecipeName.includes('brainwriting') || lowerRecipeName.includes('reverse brainstorming') ||
      lowerRecipeName.includes('random word')) {
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

  if (result?.concepts || result?.ideas || result?.sketches || result?.developed_concepts) {
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