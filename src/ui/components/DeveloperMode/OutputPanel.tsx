/**
 * @fileoverview Output Panel Component - Display execution results and console output
 * @description Shows code execution results, errors, and console output
 * @author @darianrosebrook
 */

import React from 'react'

interface OutputPanelProps {
  result: any
  isVisible: boolean
  height?: number
}

/**
 * Output panel component for displaying execution results
 */
export const OutputPanel: React.FC<OutputPanelProps> = ({
  result,
  isVisible,
  height = 200,
}) => {
  if (!isVisible) return null

  const getOutputContent = () => {
    if (!result) {
      return (
        <div
          style={{
            padding: '12px',
            color: '#888',
            fontSize: '12px',
            fontFamily: 'Monaco, Menlo, monospace',
          }}
        >
          Ready to execute code...
        </div>
      )
    }

    const { success, output, executionTime, memoryUsed, errors, warnings } =
      result

    return (
      <div style={{ padding: '8px' }}>
        {/* Status */}
        <div
          style={{
            marginBottom: '8px',
            padding: '4px 8px',
            backgroundColor: success ? '#1e3a1e' : '#3a1e1e',
            border: `1px solid ${success ? '#28a745' : '#dc3545'}`,
            borderRadius: '3px',
            fontSize: '11px',
            color: success ? '#28a745' : '#dc3545',
          }}
        >
          {success ? '✅ Success' : '❌ Failed'}
          {executionTime > 0 && (
            <span style={{ marginLeft: '8px', color: '#888' }}>
              {executionTime.toFixed(2)}ms
            </span>
          )}
          {memoryUsed > 0 && (
            <span style={{ marginLeft: '8px', color: '#888' }}>
              {memoryUsed.toFixed(1)}MB
            </span>
          )}
        </div>

        {/* Console Output */}
        {output && (
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                fontSize: '11px',
                color: '#888',
                marginBottom: '4px',
                fontWeight: 'bold',
              }}
            >
              Console Output:
            </div>
            <pre
              style={{
                backgroundColor: '#1e1e1e',
                padding: '8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontFamily: 'Monaco, Menlo, monospace',
                color: '#ffffff',
                margin: 0,
                overflow: 'auto',
                maxHeight: '80px',
              }}
            >
              {output}
            </pre>
          </div>
        )}

        {/* Errors */}
        {errors && errors.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                fontSize: '11px',
                color: '#dc3545',
                marginBottom: '4px',
                fontWeight: 'bold',
              }}
            >
              Errors ({errors.length}):
            </div>
            {errors.map((error: any, index: number) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#3a1e1e',
                  border: '1px solid #dc3545',
                  borderRadius: '3px',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontFamily: 'Monaco, Menlo, monospace',
                  color: '#ff6b6b',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  {error.type}: {error.message}
                </div>
                {error.line && (
                  <div style={{ color: '#888' }}>
                    Line {error.line}
                    {error.column ? `, Column ${error.column}` : ''}
                  </div>
                )}
                {error.stack && (
                  <details style={{ marginTop: '4px' }}>
                    <summary style={{ color: '#888', cursor: 'pointer' }}>
                      Stack Trace
                    </summary>
                    <pre
                      style={{
                        backgroundColor: '#2a2a2a',
                        padding: '4px',
                        borderRadius: '2px',
                        fontSize: '10px',
                        color: '#ccc',
                        marginTop: '4px',
                        overflow: 'auto',
                        maxHeight: '60px',
                      }}
                    >
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#ffc107',
                marginBottom: '4px',
                fontWeight: 'bold',
              }}
            >
              Warnings ({warnings.length}):
            </div>
            {warnings.map((warning: any, index: number) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#3a3a1e',
                  border: '1px solid #ffc107',
                  borderRadius: '3px',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontFamily: 'Monaco, Menlo, monospace',
                  color: '#ffd93d',
                }}
              >
                <div style={{ marginBottom: '2px' }}>
                  {warning.type}: {warning.message}
                </div>
                {warning.suggestion && (
                  <div style={{ color: '#888', fontStyle: 'italic' }}>
                    Suggestion: {warning.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        height: `${height}px`,
        backgroundColor: '#1e1e1e',
        borderTop: '1px solid #333',
        overflow: 'auto',
      }}
    >
      {getOutputContent()}
    </div>
  )
}
