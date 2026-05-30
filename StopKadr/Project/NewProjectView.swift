import SwiftUI

struct NewProjectView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    let onCreate: (String) -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("Project name", text: $title)
            }
            .navigationTitle("New Project")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        onCreate(title)
                        dismiss()
                    }
                }
            }
        }
    }
}
