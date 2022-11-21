import { buildSubgraphSchema } from '@apollo/federation';
import { addResolversToSchema, GraphQLResolverMap } from 'apollo-graphql';
import { specifiedDirectives, GraphQLSchema, printSchema } from 'graphql';
import gql from 'graphql-tag';
import { buildSchema, BuildSchemaOptions, createResolversMap, ResolversMap } from 'type-graphql';

export const buildFederatedSchema = async (
  options: Omit<BuildSchemaOptions, 'skipCheck'>,
  referenceResolvers?: GraphQLResolverMap<ResolversMap>,
): Promise<GraphQLSchema> => {
  const schema: GraphQLSchema = await buildSchema({
    ...options,
    directives: [...specifiedDirectives, ...(options.directives || [])],
    skipCheck: true,
  });

  const federatedSchema: GraphQLSchema = buildSubgraphSchema({
    typeDefs: gql(printSchema(schema)),
    resolvers: createResolversMap(schema) as GraphQLResolverMap,
  });

  if (referenceResolvers) {
    addResolversToSchema(federatedSchema, referenceResolvers);
  }

  return federatedSchema;
};
