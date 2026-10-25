/**
 * @file mcp-server-handler.ts
 * @layer Domain
 * @description Pure protocol handler implementing Model Context Protocol (MCP) v1.0 and JSON-RPC 2.0:
 *              dispatches resource reading (`brand://`, `releases://`, `metrics://`) and tools execution
 *              (`mcp_crear_tarea`, `mcp_aprobar_entregable`, `mcp_consultar_metricas`). Zero network I/O, zero classes.
 */

export interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpServerPorts {
  readResource: (uri: string) => Promise<{ uri: string; mimeType: string; text: string }>;
  callTool: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
}

export interface McpJsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpServerHandler {
  dispatch: (request: Record<string, unknown>) => Promise<McpJsonRpcResponse>;
  listResources: () => McpResourceDefinition[];
  listTools: () => McpToolDefinition[];
}

export const MCP_RESOURCES_CATALOG: McpResourceDefinition[] = [
  {
    uri: 'brand://vault/active',
    name: 'Brand Vault DNA',
    description: 'Manual de identidad, arquetipo de marca y pilares de comunicación del sello.',
    mimeType: 'application/json',
  },
  {
    uri: 'releases://active',
    name: 'Lanzamientos Activos',
    description: 'Catálogo de lanzamientos en curso con fecha T-0 y entregables asociados.',
    mimeType: 'application/json',
  },
  {
    uri: 'metrics://summary/latest',
    name: 'Resumen de Métricas',
    description: 'Consolidado de streams, oyentes únicos y retorno de pauta publicitaria.',
    mimeType: 'application/json',
  },
];

export const MCP_TOOLS_CATALOG: McpToolDefinition[] = [
  {
    name: 'mcp_crear_tarea',
    description: 'Crea un nuevo entregable o hito operativo en el cronograma del lanzamiento.',
    inputSchema: {
      type: 'object',
      properties: {
        releaseId: { type: 'string', description: 'UUID del lanzamiento' },
        title: { type: 'string', description: 'Título de la tarea o entregable' },
        dueDate: { type: 'string', description: 'Fecha de entrega ISO-8601' },
      },
      required: ['releaseId', 'title', 'dueDate'],
    },
  },
  {
    name: 'mcp_aprobar_entregable',
    description: 'Registra la aprobación formal de un arte, video o copy de campaña.',
    inputSchema: {
      type: 'object',
      properties: {
        deliverableId: { type: 'string', description: 'UUID del entregable' },
        feedback: { type: 'string', description: 'Comentario opcional' },
      },
      required: ['deliverableId'],
    },
  },
  {
    name: 'mcp_consultar_metricas',
    description: 'Obtiene métricas de streaming y CPA para una ventana temporal.',
    inputSchema: {
      type: 'object',
      properties: {
        releaseId: { type: 'string', description: 'UUID del lanzamiento' },
        timeWindow: {
          type: 'string',
          enum: ['PRE_RELEASE', 'DROP_WEEK', 'POST_RELEASE', 'ALL_TIME'],
        },
      },
      required: ['releaseId'],
    },
  },
];

/**
 * Functional factory instantiating the pure MCP server dispatcher.
 *
 * @param ports - Underlying service ports for reading resources and invoking tools
 * @returns Fully typed McpServerHandler instance
 */
export function createMcpServerHandler(ports: McpServerPorts): McpServerHandler {
  return {
    listResources: (): McpResourceDefinition[] => MCP_RESOURCES_CATALOG,
    listTools: (): McpToolDefinition[] => MCP_TOOLS_CATALOG,

    dispatch: async (request: Record<string, unknown>): Promise<McpJsonRpcResponse> => {
      // Step 1: Validate JSON-RPC envelope
      const id = (request.id as string | number | null) ?? null;
      const method = typeof request.method === 'string' ? request.method : '';

      // Step 2: Dispatch protocol methods
      switch (method) {
        case 'resources/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { resources: MCP_RESOURCES_CATALOG },
          };

        case 'resources/read': {
          const params = (request.params as { uri?: string }) || {};
          if (!params.uri) {
            return {
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: 'Parámetro URI obligatorio para resources/read' },
            };
          }
          const resourceContent = await ports.readResource(params.uri);
          return {
            jsonrpc: '2.0',
            id,
            result: { contents: [resourceContent] },
          };
        }

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { tools: MCP_TOOLS_CATALOG },
          };

        case 'tools/call': {
          const params = (request.params as { name?: string; arguments?: Record<string, unknown> }) || {};
          if (!params.name) {
            return {
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: 'Parámetro name obligatorio para tools/call' },
            };
          }
          const output = await ports.callTool(params.name, params.arguments || {});
          return {
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: JSON.stringify(output) }] },
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Método desconocido: ${method}` },
          };
      }
    },
  };
}
