import { getToken } from './auth.js';

const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

export async function fetchGraphQL(query, variables = {}) {
  const token = getToken();
  const response = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`graphql request failed (${response.status})`);
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

// normal query: flat fields, no arguments
export const QUERY_USER = `
  {
    user {
      id
      login
    }
  }
`;

// nested query with arguments: xp transactions joined to object for project name
export const QUERY_XP_TRANSACTIONS = `
  {
    transaction(
      where: { type: { _eq: "xp" } }
      order_by: { createdAt: asc }
    ) {
      amount
      createdAt
      object {
        name
        type
      }
    }
  }
`;

// query with arguments: up transactions for audit given total
export const QUERY_UP_TRANSACTIONS = `
  {
    transaction(where: { type: { _eq: "up" } }) {
      amount
    }
  }
`;

// query with arguments: down transactions for audit received total
export const QUERY_DOWN_TRANSACTIONS = `
  {
    transaction(where: { type: { _eq: "down" } }) {
      amount
    }
  }
`;

export async function fetchUserData() {
  const data = await fetchGraphQL(QUERY_USER);
  return data.user[0];
}

export async function fetchXpTransactions() {
  const data = await fetchGraphQL(QUERY_XP_TRANSACTIONS);
  return data.transaction;
}

export async function fetchAuditTotals() {
  const [upData, downData] = await Promise.all([
    fetchGraphQL(QUERY_UP_TRANSACTIONS),
    fetchGraphQL(QUERY_DOWN_TRANSACTIONS),
  ]);

  const totalUp = upData.transaction.reduce((sum, t) => sum + t.amount, 0);
  const totalDown = downData.transaction.reduce((sum, t) => sum + t.amount, 0);

  return { totalUp, totalDown };
}
