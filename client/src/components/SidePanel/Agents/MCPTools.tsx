import React, { useMemo } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import type { AgentForm } from '~/common';
import UninitializedMCPTool from './UninitializedMCPTool';
import UnconfiguredMCPTool from './UnconfiguredMCPTool';
import { useAgentPanelContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import MCPTool from './MCPTool';

export default function MCPTools({
  setShowMCPToolDialog,
}: {
  setShowMCPToolDialog: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const localize = useLocalize();
  const methods = useFormContext<AgentForm>();
  const { groupedMCPTools: allMCPTools, mcpServersMap } = useAgentPanelContext();

  const { control } = methods;
  const tools = useWatch({ control, name: 'tools' });
  const agent_id = useWatch({ control, name: 'id' });

  // Filter servers that have selected tools
  const relevantServers = useMemo(() => {
    const selectedTools = tools ?? [];
    const servers = new Map();

    // Add all servers that have selected tools
    mcpServersMap.forEach((serverInfo, serverKey) => {
      const hasSelectedTool = serverInfo.tools.some((tool) => selectedTools.includes(tool.tool_id));
      if (hasSelectedTool) {
        servers.set(serverKey, serverInfo);
      }
    });

    return servers;
  }, [tools, mcpServersMap]);

  return (
    <div className="mb-4">
      <label className="text-token-text-primary mb-2 block font-medium">
        {localize('com_ui_mcp_servers')}
      </label>
      <div>
        <div className="mb-1">
          {/* Render servers with selected tools */}
          {Array.from(relevantServers.values())
            .sort((a, b) => a.serverName.localeCompare(b.serverName))
            .map((serverInfo) => {
              const fallbackTools = allMCPTools?.[serverInfo.serverKey]
                ? allMCPTools
                : {
                    ...allMCPTools,
                    [serverInfo.serverKey]: {
                      tool_id: serverInfo.serverKey,
                      metadata: serverInfo.metadata,
                      agent_id: agent_id || '',
                      tools: serverInfo.tools,
                    },
                  };

              if (!serverInfo.isConfigured) {
                return (
                  <UnconfiguredMCPTool
                    key={`${serverInfo.serverKey}-${agent_id}`}
                    tool={serverInfo.serverKey}
                    allTools={fallbackTools}
                  />
                );
              }

              if (serverInfo.isConnected) {
                return (
                  <MCPTool
                    key={`${serverInfo.serverKey}-${agent_id}`}
                    tool={serverInfo.serverKey}
                    allTools={fallbackTools}
                    agent_id={agent_id}
                  />
                );
              }

              return (
                <UninitializedMCPTool
                  key={`${serverInfo.serverKey}-${agent_id}`}
                  tool={serverInfo.serverKey}
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
