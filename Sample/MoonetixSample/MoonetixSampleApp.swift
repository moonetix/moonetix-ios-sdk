import SwiftUI
import MoonetixOfferwall

@main
struct MoonetixSampleApp: App {
    init() {
        // The App ID from the top of your offerwall's settings page. Never the API key.
        Moonetix.configure(appId: "YOUR_APP_ID")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
