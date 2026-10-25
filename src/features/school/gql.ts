import { gql } from '@/graphql';

/**
 * The principal's school: every teacher with their classes (ClassWork fragment, see classes/gql.ts).
 * Overview, School tab, teacher and class pages all read this one cached result.
 */
export const SCHOOL_PRINCIPAL = gql(`
  query SchoolPrincipalQuery($principalId: ID!) {
    principal(id: $principalId) {
      id
      school {
        id
        name
        teachers {
          id
          name
          classes { ...ClassWork }
        }
      }
    }
  }
`);

/** Average score and member counts for the school (stats resolvers, one result per filter). */
export const SCHOOL_STATS = gql(`
  query SchoolStatsQuery($points: [StatsFilter!]!, $members: [StatsFilter!]!) {
    statsPoints(filters: $points) { points maxPoints }
    statsMembers(filters: $members) { students teachers }
  }
`);
