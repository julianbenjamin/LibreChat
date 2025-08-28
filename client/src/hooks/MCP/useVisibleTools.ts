import { useMemo } from 'react';
import type { AgentToolType } from 'librechat-data-provider';

type GroupedToolType = AgentToolType & { tools?: AgentToolType[] };
type GroupedToolsRecord = Record<string, GroupedToolType>;

interface VisibleToolsResult {
  toolIds: string[];
  mcpServerNames: string[];
}

/**
 * Custom hook to calculate visible tool IDs based on selected tools and their parent groups.
 * If any subtool of a group is selected, the parent group tool is also made visible.
 *
 * @param selectedToolIds - Array of selected tool IDs
 * @param allTools - Record of all available tools
 * @param allMCPTools - Record of all MCP tools
 * @returns Object containing separate arrays of visible tool IDs for regular and MCP tools
 */
export function useVisibleTools(
  selectedToolIds: string[] | undefined,
  allTools: GroupedToolsRecord | undefined,
  allMCPTools: GroupedToolsRecord | undefined,
): VisibleToolsResult {
  return useMemo(() => {
    const toolIds = selectedToolIds ?? [];
    const mcpServers = new Set<string>();
    const regularToolIds = new Set<string>();

    if (allTools) {
      for (const [toolId, toolObj] of Object.entries(allTools)) {
        // Add if directly selected
        if (toolIds.includes(toolId)) {
          regularToolIds.add(toolId);
        }

        // Check if any subtool is selected
        if (toolObj.tools?.length) {
          for (const subtool of toolObj.tools) {
            if (toolIds.includes(subtool.tool_id)) {
              regularToolIds.add(toolId);
              break;
            }
          }
        }
      }
    }

    if (allMCPTools) {
      for (const [toolId, toolObj] of Object.entries(allMCPTools)) {
        if (toolIds.includes(toolId)) {
          mcpServers.add(toolId);
        }

        // Check if any subtool is selected
        if (toolObj.tools?.length) {
          for (const subtool of toolObj.tools) {
            if (toolIds.includes(subtool.tool_id)) {
              mcpServers.add(toolId);
              break;
            }
          }
        }
      }
    }

    return {
      toolIds: Array.from(regularToolIds),
      mcpServerNames: Array.from(mcpServers),
    };
  }, [selectedToolIds, allTools, allMCPTools]);
}
