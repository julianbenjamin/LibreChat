import React from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import type { AgentForm } from '~/common';
import UninitializedMCPTool from './UninitializedMCPTool';
import UnconfiguredMCPTool from './UnconfiguredMCPTool';
import { useAgentPanelContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import MCPTool from './MCPTool';

export default function MCPTools({
  mcpServerNames,
  setShowMCPToolDialog,
}: {
  mcpServerNames?: string[];
  setShowMCPToolDialog: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const localize = useLocalize();
  const methods = useFormContext<AgentForm>();
  const { groupedMCPTools: allMCPTools, mcpServersMap } = useAgentPanelContext();

  const { control } = methods;
  const agent_id = useWatch({ control, name: 'id' });

  return (
    <div className="mb-4">
      <label className="text-token-text-primary mb-2 block font-medium">
        {localize('com_ui_mcp_servers')}
      </label>
      <div>
        <div className="mb-1">
          {/* Render servers with selected tools */}
          {mcpServerNames?.map((formTool) => {
            const serverInfo = mcpServersMap.get(formTool);
            if (!serverInfo) {
              return null;
            }
            const fallbackTools = allMCPTools?.[serverInfo.serverName]
              ? allMCPTools
              : {
                  ...allMCPTools,
                  [serverInfo.serverName]: {
                    tool_id: serverInfo.serverName,
                    metadata: serverInfo.metadata,
                    agent_id: agent_id || '',
                    tools: serverInfo.tools,
                  },
                };

            if (!serverInfo.isConfigured) {
              return (
                <UnconfiguredMCPTool
                  key={`${serverInfo.serverName}-${agent_id}`}
                  tool={serverInfo.serverName}
                  allTools={fallbackTools}
                />
              );
            }

            if (serverInfo.isConnected) {
              return (
                <MCPTool
                  key={`${serverInfo.serverName}-${agent_id}`}
                  tool={serverInfo.serverName}
                  allTools={fallbackTools}
                  agent_id={agent_id}
                />
              );
            }

            return (
              <UninitializedMCPTool
                key={`${serverInfo.serverName}-${agent_id}`}
                tool={serverInfo.serverName}
                allTools={fallbackTools}
              />
            );
          })}
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowMCPToolDialog(true)}
            className="btn btn-neutral border-token-border-light relative h-9 w-full rounded-lg font-medium"
            aria-haspopup="dialog"
          >
            <div className="flex w-full items-center justify-center gap-2">
              {localize('com_assistants_add_mcp_server_tools')}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
