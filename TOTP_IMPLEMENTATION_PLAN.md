1. With mocked calls this all works
2. I'm fairly sure there isn't a non mocked api call in the e2e tests atm
3. We're pretty sure that the login as the right user is working
4. We want a test that actually hits the API
5. We can't hit UAT for IP filter reasons (I think I've not actually tested), so we're launching a container in the CI
6. Run Playwright tests is provided the correct API to hit the spunup container
7. The API container does need the login to have worked?????
8. I want to see if we can get in CI, a passing test that really calls the container
