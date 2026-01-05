/**
 * API Gateway Client Example
 * Para usar no frontend React
 */

class ApiGatewayClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.timeout = 30000;
  }

  /**
   * Fazer requisição com tratamento de erro
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      token = null,
      apiKey = null,
    } = options;

    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Adicionar autorização
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (apiKey) {
      defaultHeaders['X-API-Key'] = apiKey;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : null,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Exemplo de uso
const apiGateway = new ApiGatewayClient('http://localhost:3001');

// Exemplos de requisições
async function examples() {
  try {
    // 1. Health check
    const health = await apiGateway.get('/health');
    console.log('Health:', health);

    // 2. API health
    const apiHealth = await apiGateway.get('/api/health');
    console.log('API Health:', apiHealth);

    // 3. Test Supabase
    const supabaseTest = await apiGateway.get('/api/test-supabase');
    console.log('Supabase Test:', supabaseTest);

    // 4. Com API Key
    const withApiKey = await apiGateway.get('/api/protected', {
      apiKey: 'your-api-key',
    });
    console.log('With API Key:', withApiKey);

    // 5. Com token JWT
    const withToken = await apiGateway.get('/api/profile', {
      token: 'your-jwt-token',
    });
    console.log('With Token:', withToken);

    // 6. POST request
    const postData = await apiGateway.post('/api/users', {
      name: 'John Doe',
      email: 'john@example.com',
    });
    console.log('POST Response:', postData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// React Hook Example
function useApiGateway(baseURL = 'http://localhost:3001') {
  const client = new ApiGatewayClient(baseURL);

  const get = async (endpoint, options = {}) => {
    return client.get(endpoint, options);
  };

  const post = async (endpoint, body, options = {}) => {
    return client.post(endpoint, body, options);
  };

  const put = async (endpoint, body, options = {}) => {
    return client.put(endpoint, body, options);
  };

  const deleteRequest = async (endpoint, options = {}) => {
    return client.delete(endpoint, options);
  };

  return { get, post, put, delete: deleteRequest };
}

// React Component Example
function ApiGatewayExample() {
  const api = useApiGateway();

  const handleGetHealth = async () => {
    try {
      const data = await api.get('/health');
      console.log('Health check:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePostUser = async () => {
    try {
      const data = await api.post('/api/users', {
        name: 'John Doe',
        email: 'john@example.com',
      });
      console.log('User created:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleGetHealth}>Check Health</button>
      <button onClick={handlePostUser}>Create User</button>
    </div>
  );
}

export { ApiGatewayClient, useApiGateway, ApiGatewayExample };
