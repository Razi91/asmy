Asmy is simple ARM-like processor emulator for learning purposes

### Test
`yarn test`

## Language
Language is based od GCC's ARM syntax.

### Instructions
With status and conditional flags:
* :heavy_check_mark:    `nop`
* :heavy_check_mark:    `mov`
* :heavy_check_mark:    `add`
* :heavy_check_mark:    `sub`
* :heavy_check_mark:    `mul`
* :heavy_check_mark:    `div`
* :heavy_check_mark:    `and`
* :white_check_mark:    `orr`
* :white_check_mark:    `eor`
* :white_check_mark:    `bic`
* :white_check_mark:    `asr`
* :white_check_mark:    `lsl`
* :white_check_mark:    `lsr`
* :white_check_mark:    `ror`

Test instructions:
* :heavy_check_mark:    `cmp`
* :white_check_mark:    `cmn`
* :white_check_mark:    `tst`
* :white_check_mark:    `teq`

Branching:
* :heavy_check_mark:    `b`
* :heavy_check_mark:    `bl`
* :heavy_check_mark:    `bx`
* :heavy_check_mark:    `blx`

### Differences
Since this is not real machine and there is only ARM mode,there is no instruction mode switching and instructions like `bx` are added just to be compatible