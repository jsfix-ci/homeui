'use strict';

import { JSONEditor } from "../../../3rdparty/jsoneditor";

function makeSelectWithHiddenItems () {
    return class extends JSONEditor.defaults.editors["select"] {

        build () {
            console.log('Editor: select-with-hidden-items')
            super.build()

            console.log('this: %o', this)

            var options = this.switcher_options = this.theme.getSwitcherOptions(this.input)
            console.log('var options: %o', options)

            console.log('this.schema: %o', this.schema)
            console.log('this.schema.options: %o', this.schema.options)
            console.log('this.enum_values: %o', this.enum_values)

            options.forEach((op, i) => {
                console.log(op, i)
                if (this.schema.options &&
                    this.schema.options.enum_hidden &&
                    this.schema.options.enum_hidden.includes(this.enum_values[i])) {
                    op.hidden = 'hidden'
                }
            })
        }
    }
}

export default makeSelectWithHiddenItems
