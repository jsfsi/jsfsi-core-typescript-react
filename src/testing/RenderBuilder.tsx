import { ComponentClass, FunctionComponent, default as React } from 'react'
import { createMemoryHistory, MemoryHistory } from 'history'
import { Store } from 'redux'
import { Route, Router } from 'react-router'
import { Provider } from 'react-redux'
import { render } from '@testing-library/react'

export type ComponentType<P> = FunctionComponent<P> | ComponentClass<P> | string
export type ComponentTransformer<P> = (componentType: ComponentType<P>) => ComponentType<P>

/** a react-testing-library render helper for setting up components in test with redux, routing, props or any subset of these */
export class RenderBuilder<P> {
    private componentType: ComponentType<P>
    private history: MemoryHistory
    private store: Store

    private constructor(componentType?: ComponentType<P>) {
        this.componentType = componentType
    }

    static of<P>(componentType?: ComponentType<P>) {
        return new RenderBuilder(componentType)
    }

    private propsTransform: ComponentTransformer<P> = component => component
    private routerTransform: ComponentTransformer<P> = component => component
    private reduxTransform: ComponentTransformer<P> = component => component

    withComponentType(componentType: ComponentType<P>) {
        this.componentType = componentType

        return this
    }

    withProps(props: P) {
        this.propsTransform = (componentType: ComponentType<P>) => () =>
            React.createElement(componentType, { ...props })

        return this
    }

    withRouter(route = '/', history = createMemoryHistory({ initialEntries: [route] })) {
        this.history = history

        this.routerTransform = (componentType: ComponentType<P>) => () => (
            <Router history={history}>
                <Route render={props => React.createElement(componentType, ({ ...props } as unknown) as P)} />
            </Router>
        )

        return this
    }

    withRedux(store: Store) {
        this.store = store

        this.reduxTransform = (componentType: ComponentType<P>) => () => (
            <Provider store={store}>{React.createElement(componentType)}</Provider>
        )

        return this
    }

    render() {
        let componentType = this.componentType
        componentType = this.propsTransform(componentType)
        componentType = this.routerTransform(componentType)
        componentType = this.reduxTransform(componentType)

        return {
            ...render(React.createElement(componentType)),
            history: this.history,
            store: this.store,
        }
    }
}
