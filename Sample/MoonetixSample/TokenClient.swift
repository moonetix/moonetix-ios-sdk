import Foundation

struct MoonetixTokenError: Error {}

// Asks YOUR server for a fresh token. Your server calls POST /v1/session with the API key.
// Replace the URL with your token endpoint, for example ../token-endpoint in this repository.
func fetchMoonetixToken(authToken: String) async throws -> String {
    var request = URLRequest(url: URL(string: "https://your-server.example/api/moonetix/session")!)
    request.httpMethod = "POST"
    request.timeoutInterval = 10
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    let (data, response) = try await URLSession.shared.data(for: request)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw MoonetixTokenError()
    }
    struct Body: Decodable { let token: String }
    return try JSONDecoder().decode(Body.self, from: data).token
}
