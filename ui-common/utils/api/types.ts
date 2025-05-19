/**
 * Type definitions for API functionality
 */

/**
 * Definition of a function declaration that follows the JSON Schema format
 * for external API integrations
 */
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
} 