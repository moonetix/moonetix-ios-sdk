import SwiftUI
import MoonetixOfferwall

struct ContentView: View {
    // Your own sign-in credential, so your server knows who the user is.
    let authToken = "your-own-sign-in-token"

    @State private var status = "Tap Earn coins to open the offerwall."

    var body: some View {
        VStack(spacing: 16) {
            Text(status)
                .multilineTextAlignment(.center)
            Button("Earn coins") {
                Task {
                    do {
                        let token = try await fetchMoonetixToken(authToken: authToken)
                        Moonetix.open(token: token)
                    } catch {
                        status = "The offerwall is not available right now."
                    }
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .onAppear {
            Moonetix.onClosed = {
                // Load the user's balance from your server. Rewards arrive there by postback.
                status = "Offerwall closed. Reload the balance from your server."
            }
            Moonetix.onError = { error in
                status = "\(error.code.name): \(error.message)"
            }
        }
    }
}
