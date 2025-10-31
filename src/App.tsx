import { TodoWidget } from "@/widgets/Todo/TodoWidget";
import { Toaster } from "@/components/ui/sonner";

function App() {
	return (
		<>
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4'>
				<TodoWidget />
			</div>
			<Toaster />
		</>
	);
}

export default App;
