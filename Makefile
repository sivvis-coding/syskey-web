.PHONY: dev dev-backend dev-frontend

dev: ## Start backend and frontend dev servers together (Ctrl+C stops both)
	@echo "Starting backend and frontend dev servers..."
	@(cd backend && syskey-web --reload) & BACKEND_PID=$$!; \
	(cd frontend && npm run dev) & FRONTEND_PID=$$!; \
	trap 'kill $$BACKEND_PID $$FRONTEND_PID 2>/dev/null' INT TERM; \
	wait

dev-backend: ## Start only the backend dev server
	cd backend && syskey-web --reload

dev-frontend: ## Start only the frontend dev server
	cd frontend && npm run dev
