<template>
    <Control class="number">
        <PrimeVueInputNumber v-bind="$attrs" />
    </Control>
</template>

<script lang="ts" setup>
import { InputNumberEmits, InputNumberProps } from "primevue/inputnumber";
import { computed, ref } from "vue";

import Control from "@/components/controls/Control.vue";
import PrimeVueInputNumber from "@/components/primevue/PrimeVueInputNumber.vue";

// eslint-disable-next-line
export interface Props extends InputNumberProps {}

// eslint-disable-next-line
export interface Emits extends InputNumberEmits {}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const max = ref(100);
const maxInputWidth = computed(() => `${max.value.toString().length + 1}ch`);
</script>

<style lang="scss" scoped>
.number {
    max-height: 35px;
}
:deep(.p-inputtext) {
    padding: 0 10px;
    width: v-bind(maxInputWidth);
}
:deep(.p-button) {
    margin-right: 5px;
}
</style>
