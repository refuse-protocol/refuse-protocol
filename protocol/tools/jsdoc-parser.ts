import { join } from 'path';
/**
 * @fileoverview Simple JSDoc parser for extracting documentation from TypeScript files
 * @description Parses JSDoc comments and extracts structured documentation data
 * @version 1.0.0
 */

/**
 * Simple JSDoc parser for extracting documentation from TypeScript files
 */
export class JSDocParser {
  parse(content: string): ParsedJSDoc {
    const result: ParsedJSDoc = {
      description: '',
      properties: [],
      methods: [],
      examples: [],
      tags: {},
    };

    // Extract description (first JSDoc comment)
    const descriptionMatch = content.match(/\/\*\*\s*\n((?:\s*\*.*\n?)*?)\s*\*\//);
    if (descriptionMatch) {
      result.description = this.cleanJSDocComment(descriptionMatch[1]);
    }

    // Extract @property tags
    const propertyMatches = content.matchAll(
      /@property\s+{(\w+)}\s+(\w+)\s+-\s*(.*?)(?=\n\s*\*|$)/g
    );
    for (const match of propertyMatches) {
      result.properties.push({
        type: match[1],
        name: match[2],
        description: this.cleanJSDocComment(match[3]),
      });
    }

    // Extract @param tags
    const paramMatches = content.matchAll(/@param\s+{(\w+)}\s+(\w+)\s+-\s*(.*?)(?=\n\s*\*|$)/g);
    for (const match of paramMatches) {
      result.properties.push({
        type: match[1],
        name: match[2],
        description: this.cleanJSDocComment(match[3]),
        isParameter: true,
      });
    }

    // Extract @method tags
    const methodMatches = content.matchAll(/@method\s+(\w+)\s*\n\s*\*?\s*(.*?)(?=\n\s*\*|$)/g);
    for (const match of methodMatches) {
      result.methods.push({
        name: match[1],
        description: this.cleanJSDocComment(match[2]),
      });
    }

    // Extract @example tags
    const exampleMatches = content.matchAll(/@example\s*\n\s*\*?\s*(.*?)(?=\n\s*\*|$)/g);
    for (const match of exampleMatches) {
      result.examples.push(this.cleanJSDocComment(match[1]));
    }

    return result;
  }

  private cleanJSDocComment(comment: string): string {
    return comment
      .split('\n')
      .map((line) => line.replace(/^\s*\*/, '').trim())
      .join(' ')
      .trim();
  }
}

/**
 * Parsed JSDoc interface
 */
export interface ParsedJSDoc {
  description: string;
  properties: Array<{
    type?: string;
    name: string;
    description: string;
    optional?: boolean;
    default?: string;
    isParameter?: boolean;
  }>;
  methods: Array<{
    name: string;
    description: string;
    parameters?: Array<{
      name: string;
      type?: string;
      description: string;
    }>;
    returns?: string;
  }>;
  examples: string[];
  tags: Record<string, string>;
}
