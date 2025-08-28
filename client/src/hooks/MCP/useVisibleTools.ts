import { useMemo } from 'react';
import type { AgentToolType } from 'librechat-data-provider';

type GroupedToolType = AgentToolType & { tools?: AgentToolType[] };
type GroupedToolsRecord = Record<string, GroupedToolType>;

/**
 * Custom hook to calculate visible tool IDs based on selected tools and their parent groups.
 * If any subtool of a group is selected, the parent group tool is also made visible.
 *
 * @param selectedToolIds - Array of selected tool IDs
 * @param allTools - Record of all available tools
 * @param allMCPTools - Record of all MCP tools
 * @returns Set of visible tool IDs including parent groups
 */
export function useVisibleTools(
  selectedToolIds: string[] | undefined,
  allTools: GroupedToolsRecord | undefined,
  allMCPTools: GroupedToolsRecord | undefined,
): Set<string> {
  return useMemo(() => {
    const toolIds = selectedToolIds ?? [];
    const visibleIds = new Set(toolIds);

    // Single pass through tools to add parent groups
    const toolRecords = [
      ...(allTools ? Object.entries(allTools) : []),
      ...(allMCPTools ? Object.entries(allMCPTools) : []),
    ];

    for (const [toolId, toolObj] of toolRecords) {
      if (toolObj.tools?.length) {
        // Check if any subtool is selected
        for (const subtool of toolObj.tools) {
          if (toolIds.includes(subtool.tool_id)) {
            visibleIds.add(toolId);
            break; // No need to check other subtools once we find one
          }
        }
      }
    }

    return visibleIds;
  }, [selectedToolIds, allTools, allMCPTools]);
}
