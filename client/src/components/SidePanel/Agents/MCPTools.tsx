import React from 'react';
import { Constants } from 'librechat-data-provider';
import { useWatch, useFormContext } from 'react-hook-form';
import type { AgentForm } from '~/common';
import { useMCPServerManager } from '~/hooks/MCP/useMCPServerManager';
import UninitializedMCPTool from './UninitializedMCPTool';
import UnconfiguredMCPTool from './UnconfiguredMCPTool';
import { useGetStartupConfig } from '~/data-provider';
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
  const { data: startupConfig } = useGetStartupConfig();
  const { groupedTools: allTools, groupedMCPTools: allMCPTools } = useAgentPanelContext();

  const { connectionStatus } = useMCPServerManager();

  const { control } = methods;
  const tools = useWatch({ control, name: 'tools' });
  const agent_id = useWatch({ control, name: 'id' });

  // Determine what to show
  const selectedToolIds = tools ?? [];
  const visibleToolIds = new Set(selectedToolIds);

  // Check what group parent tools should be shown if any subtool is present
  Object.entries(allTools ?? {}).forEach(([toolId, toolObj]) => {
    if (toolObj.tools?.length) {
      // if any subtool of this group is selected, ensure group parent tool rendered
      if (toolObj.tools.some((st) => selectedToolIds.includes(st.tool_id))) {
        visibleToolIds.add(toolId);
      }
    }
  });

  Object.entries(allMCPTools ?? {}).forEach(([toolId, toolObj]) => {
    if (toolObj.tools?.length) {
      if (toolObj.tools.some((st) => selectedToolIds.includes(st.tool_id))) {
        visibleToolIds.add(toolId);
      }
    }
  });

  const agentMCPServers = new Set();
  tools?.forEach((tool) => {
    if (tool.includes(Constants.mcp_delimiter)) {
      const parts = tool.split(Constants.mcp_delimiter);
      const serverName = parts[1]?.toLowerCase();
      if (serverName) {
        agentMCPServers.add(serverName);
      }
    }
  });

  const configuredMCPServers = startupConfig?.mcpServers
    ? Object.keys(startupConfig.mcpServers)
    : [];

  const savedMCPTools = Object.entries(allMCPTools ?? {}).filter(([, toolObj]) => {
    if ((toolObj.tools?.length ?? 0) === 0) return false;
    return toolObj.tools?.some((st) => tools?.includes(st.tool_id));
  });

  const fallbackMCPTools = configuredMCPServers
    .filter((serverName) => agentMCPServers.has(serverName.toLowerCase()))
    .map((serverName) => {
      const serverTools =
        tools
          ?.filter((tool) => tool.includes(`${Constants.mcp_delimiter}${serverName.toLowerCase()}`))
          .map((toolId) => ({
            tool_id: toolId,
            metadata: {
              name: toolId.split(Constants.mcp_delimiter)[0] || toolId,
              description: `MCP Tool: ${toolId}`,
            },
            agent_id: agent_id || '',
          })) || [];

      return [
        serverName.toLowerCase(),
        {
          tool_id: serverName.toLowerCase(),
          metadata: {
            name: serverName,
            pluginKey: serverName.toLowerCase(),
            description: `MCP Server: ${serverName}`,
            icon: '',
          },
          agent_id: agent_id || '',
          tools: serverTools,
        },
      ];
    });

  /** Servers that are saved in the agent but no longer are present in the YAML */
  const unconfiguredMCPTools = Array.from(agentMCPServers)
    .filter(
      (serverName) =>
        !configuredMCPServers.some(
          (configuredServer) => configuredServer.toLowerCase() === serverName,
        ),
    )
    .map((serverName) => {
      const serverTools =
        tools
          ?.filter((tool) => tool.includes(`${Constants.mcp_delimiter}${serverName}`))
          .map((toolId) => ({
            tool_id: toolId,
            metadata: {
              name: toolId.split(Constants.mcp_delimiter)[0] || toolId,
              description: `MCP Tool: ${toolId}`,
            },
            agent_id: agent_id || '',
          })) || [];

      return [
        serverName,
        {
          tool_id: serverName,
          metadata: {
            name: serverName,
            pluginKey: serverName,
            description: `MCP Server: ${serverName}`,
            icon: '',
          },
          agent_id: agent_id || '',
          tools: serverTools,
        },
      ];
    });

  const allMCPToolsToShow = new Map();

  savedMCPTools.forEach(([toolId, toolObj]) => {
    allMCPToolsToShow.set(toolId, toolObj);
  });

  fallbackMCPTools.forEach(([toolId, toolObj]) => {
    allMCPToolsToShow.set(toolId, toolObj);
  });

  unconfiguredMCPTools.forEach(([toolId, toolObj]) => {
    allMCPToolsToShow.set(toolId, toolObj);
  });

  const finalMCPTools = Array.from(allMCPToolsToShow.entries()).sort(
    ([, toolObjA], [, toolObjB]) => {
      const nameA = toolObjA?.metadata?.name || '';
      const nameB = toolObjB?.metadata?.name || '';
      return nameA.localeCompare(nameB);
    },
  );

  return (
    <div className="mb-4">
      <label className="text-token-text-primary mb-2 block font-medium">
        {localize('com_ui_mcp_servers')}
      </label>
      <div>
        <div className="mb-1">
          {finalMCPTools.map(([toolId, toolObj]) => {
            const fallbackTools = allMCPTools?.[toolId as string]
              ? allMCPTools
              : {
                  ...allMCPTools,
                  [toolId]: toolObj,
                };

            const serverName = toolObj?.metadata?.name;
            const isConnected =
              serverName && connectionStatus[serverName]?.connectionState === 'connected';

            // Check if this is an unconfigured server
            const isUnconfigured = unconfiguredMCPTools.some(([id]) => id === toolId);

            if (isUnconfigured) {
              return (
                <UnconfiguredMCPTool
                  key={`${toolId as string}-${agent_id}`}
                  tool={toolId as string}
                  allTools={fallbackTools}
                />
              );
            }

            if (isConnected) {
              return (
                <MCPTool
                  key={`${toolId as string}-${agent_id}`}
                  tool={toolId as string}
                  allTools={fallbackTools}
                  agent_id={agent_id}
                />
              );
            }

            return (
              <UninitializedMCPTool
                key={`${toolId as string}-${agent_id}`}
                tool={toolId as string}
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
